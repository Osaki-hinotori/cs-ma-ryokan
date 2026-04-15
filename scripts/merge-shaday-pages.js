#!/usr/bin/env node
// Shadayさんの3つのNotionページを1つに統合するスクリプト
// 使い方: NOTION_API_KEY=ntn_xxx node scripts/merge-shaday-pages.js

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_VERSION = '2022-06-28';
const BASE = 'https://api.notion.com/v1';

// 統合先（最初のページ）
const KEEP_PAGE_ID = '33ba8bd0-ad2a-81df-b3aa-d1132856790e';
// 統合元（会話ログを移してから削除）
const MERGE_PAGE_IDS = [
  '33ba8bd0-ad2a-81ff-8082-fab59b57176f', // 26_4/7 call me Shaday
  '342a8bd0-ad2a-81e8-9183-caf818e65918', // 26_4/14 call me Shaday
];

async function notionFetch(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Notion API ${res.status}: ${err}`);
  }
  return res.json();
}

async function getPageBlocks(pageId) {
  const blocks = [];
  let cursor = undefined;
  do {
    const url = `/blocks/${pageId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`;
    const data = await notionFetch(url);
    blocks.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return blocks;
}

async function getPageProperties(pageId) {
  return notionFetch(`/pages/${pageId}`);
}

// Convert existing block to appendable format
function blockToAppendable(block) {
  const type = block.type;
  if (!block[type]) return null;

  // Only handle common block types
  const supported = ['paragraph', 'heading_1', 'heading_2', 'heading_3',
    'bulleted_list_item', 'numbered_list_item', 'quote', 'callout',
    'divider', 'toggle'];

  if (!supported.includes(type)) return null;

  if (type === 'divider') {
    return { type: 'divider', divider: {} };
  }

  const content = {};
  if (block[type].rich_text) {
    content.rich_text = block[type].rich_text.map(rt => ({
      type: 'text',
      text: { content: rt.plain_text || '' },
      annotations: rt.annotations || {},
    }));
  }
  if (block[type].color) {
    content.color = block[type].color;
  }

  return { type, [type]: content };
}

async function appendBlocks(pageId, blocks) {
  // Notion API allows max 100 blocks per request
  for (let i = 0; i < blocks.length; i += 100) {
    const chunk = blocks.slice(i, i + 100);
    await notionFetch(`/blocks/${pageId}/children`, 'PATCH', {
      children: chunk,
    });
  }
}

async function archivePage(pageId) {
  await notionFetch(`/pages/${pageId}`, 'PATCH', {
    archived: true,
  });
}

async function main() {
  if (!NOTION_API_KEY) {
    console.error('Error: NOTION_API_KEY 環境変数を設定してください');
    console.error('使い方: NOTION_API_KEY=ntn_xxx node scripts/merge-shaday-pages.js');
    process.exit(1);
  }

  console.log('=== Shadayページ統合スクリプト ===\n');

  // 1. 統合先ページの情報を表示
  const keepPage = await getPageProperties(KEEP_PAGE_ID);
  const keepTitle = keepPage.properties?.title?.title?.[0]?.plain_text || 'Unknown';
  console.log(`✅ 統合先: ${keepTitle} (${KEEP_PAGE_ID})`);

  // 2. 各統合元ページからブロックを取得して移動
  for (const mergeId of MERGE_PAGE_IDS) {
    const mergePage = await getPageProperties(mergeId);
    const mergeTitle = mergePage.properties?.title?.title?.[0]?.plain_text || 'Unknown';
    console.log(`\n📋 統合元: ${mergeTitle} (${mergeId})`);

    const blocks = await getPageBlocks(mergeId);
    console.log(`   ブロック数: ${blocks.length}`);

    if (blocks.length === 0) {
      console.log('   → ブロックなし、スキップ');
      continue;
    }

    // 区切り + ソースヘッダーを追加
    const separator = [
      { type: 'divider', divider: {} },
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: { content: `── ${mergeTitle} から統合 ──` },
            annotations: { bold: true, color: 'gray' },
          }],
        },
      },
    ];

    // ブロックを変換
    const appendable = blocks
      .map(blockToAppendable)
      .filter(Boolean);

    if (appendable.length === 0) {
      console.log('   → 変換可能なブロックなし、スキップ');
      continue;
    }

    // 統合先に追加
    await appendBlocks(KEEP_PAGE_ID, [...separator, ...appendable]);
    console.log(`   → ${appendable.length} ブロックを統合先に追加`);

    // 統合元をアーカイブ
    await archivePage(mergeId);
    console.log(`   → ページをアーカイブ済み`);
  }

  // 3. 統合先ページのプロパティを最新に更新
  console.log('\n📝 統合先ページのプロパティを更新中...');
  await notionFetch(`/pages/${KEEP_PAGE_ID}`, 'PATCH', {
    properties: {
      'CSステータス': { select: { name: '提案中' } },
    },
  });
  console.log('   → CSステータス: 提案中');

  console.log('\n🎉 統合完了！');
  console.log(`   統合先ページ: https://www.notion.so/${KEEP_PAGE_ID.replace(/-/g, '')}`);
}

main().catch(err => {
  console.error('エラー:', err.message);
  process.exit(1);
});
