const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const CS_INBOX_CHANNEL = 'C0APC5NDKR9'; // #2_ryokanbook_cs_inbox
const OSAKI_USER_ID = 'U06QHC1JGPP';

async function postSlackMessage(channel, text, blocks = null) {
  const body = {
    channel,
    text,
  };
  if (blocks) body.blocks = blocks;

  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error('Slack API error:', data.error);
  }
  return data;
}

// Notify CS inbox with incoming message + AI draft
async function notifyNewMessage({ customerName, channel, messageText, draft, notionPageId }) {
  const notionUrl = `https://www.notion.so/${notionPageId.replace(/-/g, '')}`;
  const time = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `📩 新着メッセージ【${channel}】` },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*顧客:* ${customerName}\n*チャネル:* ${channel}\n*時刻:* ${time}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*受信メッセージ:*\n>${messageText.split('\n').join('\n>')}`,
      },
    },
  ];

  if (draft) {
    // Truncate draft for Slack (max 3000 chars per block)
    const truncatedDraft = draft.length > 2500 ? draft.slice(0, 2500) + '...' : draft;
    blocks.push(
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*📝 AIドラフト:*\n${truncatedDraft}`,
        },
      }
    );
  }

  blocks.push(
    { type: 'divider' },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `<${notionUrl}|Notionで開く> | <@${OSAKI_USER_ID}>`,
        },
      ],
    }
  );

  const fallbackText = `📩 【${channel}】${customerName}: ${messageText.slice(0, 100)}`;
  await postSlackMessage(CS_INBOX_CHANNEL, fallbackText, blocks);
}

// Post Osaki task notification
async function notifyOsakiTask(taskText) {
  const text = `📋 大﨑タスク <@${OSAKI_USER_ID}>\n${taskText}`;
  await postSlackMessage(CS_INBOX_CHANNEL, text);
}

module.exports = { notifyNewMessage, notifyOsakiTask, postSlackMessage };
