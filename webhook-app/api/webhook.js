const { resolveInstagramUser } = require('../lib/instagram');
const { findCustomerByChannel, createCustomerPage, appendMessage, updatePageProperties } = require('../lib/notion');
const { notifyNewMessage } = require('../lib/slack');
const { generateDraft } = require('../lib/claude');

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'ryokanbook_verify';

// Channel detection by Instagram entry.id
const CHANNEL_MAP = {
  '17841407360154074': 'Insta_YRB',
  '17841474294901724': 'Insta_JoJ',
};

module.exports = async function handler(req, res) {
  // GET = Meta webhook verification
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified');
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // POST = incoming message
  if (req.method === 'POST') {
    try {
      const body = req.body;
      if (!body || !body.entry) {
        return res.status(200).send('OK');
      }

      for (const entry of body.entry) {
        const channel = CHANNEL_MAP[entry.id] || 'WhatsApp';

        // Instagram messaging
        if (entry.messaging) {
          for (const event of entry.messaging) {
            await processInstagramMessage(event, channel);
          }
        }

        // WhatsApp (changes format)
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'messages' && change.value?.messages) {
              for (const msg of change.value.messages) {
                await processWhatsAppMessage(msg, change.value);
              }
            }
          }
        }
      }

      return res.status(200).send('OK');
    } catch (err) {
      console.error('Webhook error:', err);
      return res.status(200).send('OK'); // Always 200 to prevent Meta retries
    }
  }

  return res.status(405).send('Method not allowed');
};

async function processInstagramMessage(event, channel) {
  const message = event.message;
  if (!message) return; // No message payload (read receipt, etc.)

  const senderId = event.sender?.id;
  if (!senderId) return; // Empty sender (read receipt, reaction)
  if (message.is_echo) return; // Our own message
  if (message.is_deleted) return; // Deleted message

  const messageText = message.text || '[media]';
  const timestamp = new Date(event.timestamp).toISOString();

  // Resolve sender name via Instagram Graph API
  const senderName = await resolveInstagramUser(senderId);
  const displayName = senderName || `IG User ${senderId}`;

  console.log(`[${channel}] ${displayName}: ${messageText}`);

  // Find or create customer in Notion
  let customer = await findCustomerByChannel(displayName, channel);
  if (!customer) {
    customer = await createCustomerPage(displayName, channel, senderId);
  }

  // Append incoming message to Notion page
  await appendMessage(customer.id, 'received', displayName, messageText, timestamp);

  // Generate draft reply via Claude API
  let draft = null;
  try {
    const conversationHistory = customer.conversationSummary || '';
    draft = await generateDraft({
      customerName: displayName,
      channel,
      messageText,
      conversationHistory,
      language: detectLanguage(messageText),
    });
  } catch (err) {
    console.error('Draft generation failed:', err);
  }

  // Save draft to Notion page if generated
  if (draft) {
    await appendMessage(customer.id, 'draft', 'Yohei (AI Draft)', draft, new Date().toISOString());
  }

  // Update CS status
  await updatePageProperties(customer.id, {
    'CSステータス': { select: { name: '初回返信待ち' } },
  });

  // Notify Slack
  await notifyNewMessage({
    customerName: displayName,
    channel,
    messageText,
    draft,
    notionPageId: customer.id,
  });
}

async function processWhatsAppMessage(msg, value) {
  const senderId = msg.from;
  if (!senderId) return;

  const messageText = msg.text?.body || msg.type || '[media]';
  const timestamp = new Date(parseInt(msg.timestamp) * 1000).toISOString();

  // Get contact name from WhatsApp
  const contact = value.contacts?.find(c => c.wa_id === senderId);
  const displayName = contact?.profile?.name || `WA User ${senderId}`;
  const channel = 'WhatsApp';

  console.log(`[${channel}] ${displayName}: ${messageText}`);

  // Find or create customer in Notion
  let customer = await findCustomerByChannel(displayName, channel);
  if (!customer) {
    customer = await createCustomerPage(displayName, channel, senderId);
  }

  // Append incoming message
  await appendMessage(customer.id, 'received', displayName, messageText, timestamp);

  // Generate draft reply
  let draft = null;
  try {
    const conversationHistory = customer.conversationSummary || '';
    draft = await generateDraft({
      customerName: displayName,
      channel,
      messageText,
      conversationHistory,
      language: detectLanguage(messageText),
    });
  } catch (err) {
    console.error('Draft generation failed:', err);
  }

  if (draft) {
    await appendMessage(customer.id, 'draft', 'Yohei (AI Draft)', draft, new Date().toISOString());
  }

  await updatePageProperties(customer.id, {
    'CSステータス': { select: { name: '初回返信待ち' } },
  });

  await notifyNewMessage({
    customerName: displayName,
    channel,
    messageText,
    draft,
    notionPageId: customer.id,
  });
}

function detectLanguage(text) {
  if (!text) return 'en';
  // Simple detection: Chinese characters → zh, Japanese kana → ja, else en
  if (/[\u4e00-\u9fff]/.test(text)) {
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
    return 'zh-TW'; // Default to Traditional Chinese (most Ryokanbook customers)
  }
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  return 'en';
}
