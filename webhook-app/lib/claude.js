const Anthropic = require('@anthropic-ai/sdk');
const { CS_SYSTEM_PROMPT } = require('./rules');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateDraft({ customerName, channel, messageText, conversationHistory, language }) {
  const userPrompt = buildUserPrompt({ customerName, channel, messageText, conversationHistory, language });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: CS_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n');

  return text || null;
}

function buildUserPrompt({ customerName, channel, messageText, conversationHistory, language }) {
  let prompt = `以下の顧客メッセージに対する返信ドラフトを作成してください。

【顧客情報】
名前: ${customerName}
チャネル: ${channel}
言語: ${language === 'ja' ? '日本語' : language === 'zh-TW' ? '繁体字中国語' : language === 'zh-CN' ? '簡体字中国語' : '英語'}

【受信メッセージ】
${messageText}`;

  if (conversationHistory) {
    prompt += `

【過去のやり取り（直近）】
${conversationHistory}`;
  }

  prompt += `

返信フォーマット:
1. まず相手メッセージの日本語訳
2. 返信ドラフト（相手の言語で）
3. 返信ドラフトの日本語訳`;

  // Instagram-specific rules
  if (channel.startsWith('Insta')) {
    prompt += `\n\n※ Instagram DMなので950文字以内に収めてください。`;
  }

  return prompt;
}

module.exports = { generateDraft };
