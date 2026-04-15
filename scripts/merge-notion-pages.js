#!/usr/bin/env node
// Notion顧客ページ統合スクリプト（汎用版）
// 使い方: NOTION_API_KEY=ntn_xxx node scripts/merge-notion-pages.js <統合先ID> <統合元ID1> [統合元ID2] ...
// 例: NOTION_API_KEY=ntn_xxx node scripts/merge-notion-pages.js 33ba8bd0ad2a81dfb3aad1132856790e 33ba8bd0ad2a81ff8082fab59b57176f

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_VERSION = '2022-06-28';
const BASE = 'https://api.notion.com/v1';

function parseId(raw) {
  const clean = raw.replace(/-/g, '');
  if (clean.length !== 32) throw new Error(`Invalid page ID: ${raw}`);
  return `${clean.slice(0,8)}-${clean.slice(8,12)}-${clean.slice(12,16)}-${clean.slice(16,20)}-${clean.slice(20)}`;
}

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

async function getPageTitle(pageId) {
  const page = await notionFetch(`/pages/${pageId}`);
  return page.properties?.title?.title?.[0]?.plain_text || 'Unknown';
}

function blockToAppendable(block) {
  const type = block.type;
  if (!block[type]) return null;
  const supported = ['paragraph', 'heading_1', 'heading_2', 'heading_3',
    'bulleted_list_item', 'numbered_list_item', 'quote', 'callout',
    'divider', 'toggle'];
  if (!supported.includes(type)) return null;
  if (type === 'divider') return { type: 'divider', divider: {} };
  const content = {};
  if (block[type].rich_text) {
    content.rich_text = block[type].rich_text.map(rt => ({
      type: 'text',
      text: { content: rt.plain_text || '' },
      annotations: rt.annotations || {},
    }));
  }
  if (block[type].color) content.color = block[type].color;
  return { type, [type]: content };
}

async function appendBlocks(pageId, blocks) {
  for (let i = 0; i < blocks.length; i += 100) {
    await notionFetch(`/blocks/${pageId}/children`, 'PATCH', {
      children: blocks.slice(i, i + 100),
    });
  }
}

async function archivePage(pageId) {
  await notionFetch(`/pages/${pageId}`, 'PATCH', { archived: true });
}

async function main() {
  const args = process.argv.slice(2);
  if (!NOTION_API_KEY || args.length < 2) {
    console.error('使い方: NOTION_API_KEY=ntn_xxx node scripts/merge-notion-pages.js <統合先ID> <統合元ID1> [統合元ID2] ...');
    process.exit(1);
  }

  const keepId = parseId(args[0]);
  const mergeIds = args.slice(1).map(parseId);

  console.log('=== Notionページ統合 ===\n');
  const keepTitle = await getPageTitle(keepId);
  console.log(`✅ 統合先: ${keepTitle}`);

  for (const mergeId of mergeIds) {
    const title = await getPageTitle(mergeId);
    console.log(`\n📋 統合元: ${title}`);
    const blocks = await getPageBlocks(mergeId);
    console.log(`   ブロック数: ${blocks.length}`);
    if (!blocks.length) { console.log('   → スキップ'); continue; }

    const separator = [
      { type: 'divider', divider: {} },
      { type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: `── ${title} から統合 ──` }, annotations: { bold: true, color: 'gray' } }] } },
    ];
    const appendable = blocks.map(blockToAppendable).filter(Boolean);
    if (!appendable.length) { console.log('   → 変換可能ブロックなし'); continue; }

    await appendBlocks(keepId, [...separator, ...appendable]);
    console.log(`   → ${appendable.length} ブロック追加`);
    await archivePage(mergeId);
    console.log(`   → アーカイブ済み`);
  }

  console.log('\n🎉 統合完了！');
}

main().catch(err => { console.error('エラー:', err.message); process.exit(1); });
