const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_CS_DB_ID = process.env.NOTION_CS_DB_ID || '8c07ab1b-3954-4ade-ac68-a683e52b85df';
const NOTION_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

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

  const res = await fetch(`${NOTION_BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Notion API error ${res.status}: ${err}`);
  }
  return res.json();
}

// Search for existing customer page by name and channel
async function findCustomerByChannel(name, channel) {
  const data = await notionFetch(`/databases/${NOTION_CS_DB_ID}/query`, 'POST', {
    filter: {
      property: 'title',
      title: { contains: name },
    },
    page_size: 5,
  });

  if (data.results && data.results.length > 0) {
    const page = data.results[0];
    // Get existing conversation from page content for context
    let conversationSummary = '';
    try {
      const blocks = await notionFetch(`/blocks/${page.id}/children?page_size=50`);
      conversationSummary = blocks.results
        ?.filter(b => b.type === 'paragraph')
        .map(b => b.paragraph?.rich_text?.map(t => t.plain_text).join('') || '')
        .filter(Boolean)
        .slice(-10) // Last 10 paragraphs for context
        .join('\n');
    } catch (e) {
      console.error('Failed to fetch conversation history:', e);
    }
    return { id: page.id, conversationSummary };
  }
  return null;
}

// Create new customer page in CS管理DB
async function createCustomerPage(name, channel, externalId) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const year = now.getFullYear().toString().slice(-2);
  const title = `${year}_${month}/${day} ${name}（${channel}）`;

  const page = await notionFetch('/pages', 'POST', {
    parent: { database_id: NOTION_CS_DB_ID },
    properties: {
      title: {
        title: [{ text: { content: title } }],
      },
      'CSステータス': {
        select: { name: '初回返信待ち' },
      },
      'チャネル': {
        select: { name: channel },
      },
    },
  });

  return { id: page.id, conversationSummary: '' };
}

// Append a message block to a customer's Notion page
async function appendMessage(pageId, type, sender, text, timestamp) {
  const time = new Date(timestamp).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  const prefix = type === 'received' ? '📩 受信'
    : type === 'sent' ? '📤 送信'
    : type === 'draft' ? '📝 AIドラフト'
    : '💬';

  const header = `${prefix}（${time}）${sender}`;

  await notionFetch(`/blocks/${pageId}/children`, 'PATCH', {
    children: [
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { type: 'text', text: { content: header }, annotations: { bold: true } },
          ],
        },
      },
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { type: 'text', text: { content: text } },
          ],
        },
      },
    ],
  });
}

// Update page properties (CS status, channel, phase, etc.)
async function updatePageProperties(pageId, properties) {
  await notionFetch(`/pages/${pageId}`, 'PATCH', { properties });
}

module.exports = {
  findCustomerByChannel,
  createCustomerPage,
  appendMessage,
  updatePageProperties,
};
