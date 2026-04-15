const YRB_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const JOJ_TOKEN = process.env.INSTAGRAM_JOJ_ACCESS_TOKEN;

// Resolve Instagram user ID to display name
// Tries YRB token first, then falls back to JoJ token
async function resolveInstagramUser(userId) {
  const tokens = [YRB_TOKEN, JOJ_TOKEN].filter(Boolean);

  for (const token of tokens) {
    try {
      const res = await fetch(
        `https://graph.instagram.com/v21.0/${userId}?fields=name,username&access_token=${token}`
      );
      if (res.ok) {
        const data = await res.json();
        return data.name || data.username || null;
      }
    } catch (err) {
      console.error(`Instagram API error with token: ${err.message}`);
    }
  }

  return null;
}

module.exports = { resolveInstagramUser };
