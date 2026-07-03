const { Redis } = require('@upstash/redis');

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn('[redis] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — Redis calls will fail.');
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// ---- small JSON helpers so the rest of the codebase never touches JSON.stringify/parse ----
async function getJSON(key) {
  const val = await redis.get(key);
  if (val === null || val === undefined) return null;
  // upstash auto-parses JSON-looking strings sometimes; handle both cases
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

async function setJSON(key, value, opts) {
  const str = JSON.stringify(value);
  if (opts && opts.exSeconds) {
    return redis.set(key, str, { ex: opts.exSeconds });
  }
  return redis.set(key, str);
}

async function del(key) {
  return redis.del(key);
}

async function listKeys(prefix) {
  // SCAN-based listing since Upstash discourages KEYS in prod, but for our modest scale this is fine
  const keys = [];
  let cursor = 0;
  do {
    const [nextCursor, batch] = await redis.scan(cursor, { match: `${prefix}*`, count: 100 });
    keys.push(...batch);
    cursor = Number(nextCursor);
  } while (cursor !== 0);
  return keys;
}

module.exports = { redis, getJSON, setJSON, del, listKeys };
