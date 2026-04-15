const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_CS_DB_ID = process.env.NOTION_CS_DB_ID || '8c07ab1b-3954-4ade-ac68-a683e52b85df';
const NOTION_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

// Notion rich_text has a 2000 character limit per element
const NOTION_TEXT_LIMIT = 2000;

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

// Split text into chunks that fit Notion's 2000-char rich_text limit
function splitText(text, limit = NOTION_TEXT_LIMIT) {
  if (text.length <= limit) return [text];
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= limit) {
      chunks.push(remaining);
      break;
    }
    // Try to break at a newline within the limit
    let breakAt = remaining.lastIndexOf('\n', limit);
    if (breakAt < limit * 0.5) breakAt = -1; // Too far back, ignore
    if (breakAt === -1) breakAt = limit;
    chunks.push(remaining.slice(0, breakAt));
    remaining = remaining.slice(breakAt);
  }
  return chunks;
}

// Search for existing customer page by externalId (IG user ID or WA phone number)
async function findCustomerByExternalId(externalId, channel) {
  // Primary: search by externalId property (reliable)
  const data = await notionFetch(`/databases/${NOTION_CS_DB_ID}/query`, 'POST', {
    filter: {
      and: [
        { property: 'externalId', rich_text: { equals: externalId } },
        { property: 'チャネル', select: { equals: channel } },
      ],
    },
    page_size: 1,
  });

  if (data.results && data.results.length > 0) {
    const page = data.results[0];
    const conversationSummary = await fetchConversationHistory(page.id);
    return { id: page.id, conversationSummary, isNew: false };
  }
  return null;
}

// Fallback: search by name (for pages created before externalId was added)
async function findCustomerByName(name, channel) {
  const data = await notionFetch(`/databases/${NOTION_CS_DB_ID}/query`, 'POST', {
    filter: {
      and: [
        { property: 'title', title: { contains: name } },
        { property: 'チャネル', select: { equals: channel } },
      ],
    },
    page_size: 3,
  });

  if (data.results && data.results.length > 0) {
    const page = data.results[0];
    const conversationSummary = await fetchConversationHistory(page.id);
    return { id: page.id, conversationSummary, isNew: false };
  }
  return null;
}

// Combined customer lookup: externalId first, then name fallback
async function findCustomer(externalId, name, channel) {
  const byId = await findCustomerByExternalId(externalId, channel);
  if (byId) return byId;

  const byName = await findCustomerByName(name, channel);
  if (byName) {
    // Backfill externalId on legacy pages
    try {
      await updatePageProperties(byName.id, {
        'externalId': { rich_text: [{ text: { content: externalId } }] },
      });
    } catch (e) {
      console.error('Failed to backfill externalId:', e);
    }
    return byName;
  }

  return null;
}

// Fetch conversation history from page blocks, excluding AI drafts
async function fetchConversationHistory(pageId) {
  try {
    const blocks = await notionFetch(`/blocks/${pageId}/children?page_size=100`);
    const paragraphs = blocks.results?.filter(b => b.type === 'paragraph') || [];

    const lines = [];
    let skipNext = false;
    for (const block of paragraphs) {
      const text = block.paragraph?.rich_text?.map(t => t.plain_text).join('') || '';
      if (!text) continue;

      // Skip AI draft blocks (header + body)
      if (text.startsWith('📝 AIドラフト')) {
        skipNext = true;
        continue;
      }
      if (skipNext) {
        skipNext = false;
        continue;
      }

      lines.push(text);
    }

    // Return last 20 lines for context
    return lines.slice(-20).join('\n');
  } catch (e) {
    console.error('Failed to fetch conversation history:', e);
    return '';
  }
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
      'externalId': {
        rich_text: [{ text: { content: externalId } }],
      },
    },
  });

  return { id: page.id, conversationSummary: '', isNew: true };
}

// Append a message block to a customer's Notion page
async function appendMessage(pageId, type, sender, text, timestamp) {
  // Guard against empty/null text
  const safeText = (text || '').trim();
  if (!safeText) {
    console.warn('appendMessage: empty text, skipping');
    return;
  }

  const time = new Date(timestamp).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  const prefix = type === 'received' ? '📩 受信'
    : type === 'sent' ? '📤 送信'
    : type === 'draft' ? '📝 AIドラフト'
    : '💬';

  const header = `${prefix}（${time}）${sender}`;

  // Split long text into multiple rich_text elements (2000 char limit each)
  const textChunks = splitText(safeText);
  const richTextElements = textChunks.map(chunk => ({
    type: 'text',
    text: { content: chunk },
  }));

  await notionFetch(`/blocks/${pageId}/children`, 'PATCH', {
    children: [
      { type: 'divider', divider: {} },
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
          rich_text: richTextElements,
        },
      },
    ],
  });
}

// Check if a message was already recorded (dedup by text + timestamp)
async function isDuplicateMessage(pageId, messageText, timestamp) {
  try {
    const blocks = await notionFetch(`/blocks/${pageId}/children?page_size=10`);
    const recent = blocks.results?.slice(-6) || [];
    const time = new Date(timestamp).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

    for (const block of recent) {
      if (block.type !== 'paragraph') continue;
      const text = block.paragraph?.rich_text?.map(t => t.plain_text).join('') || '';
      // Check if header with same timestamp exists
      if (text.includes(time) && text.includes('📩 受信')) {
        return true;
      }
    }
  } catch (e) {
    console.error('Dedup check failed:', e);
  }
  return false;
}

// Update page properties (CS status, channel, phase, etc.)
async function updatePageProperties(pageId, properties) {
  await notionFetch(`/pages/${pageId}`, 'PATCH', { properties });
}

module.exports = {
  findCustomer,
  createCustomerPage,
  appendMessage,
  isDuplicateMessage,
  updatePageProperties,
};
