const axios = require('axios');

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Lightweight Upstash Redis client using their REST API.
 * Avoids the need for a full ioredis connection; works in serverless too.
 *
 * If UPSTASH credentials are not set, all operations are no-ops
 * (returns null on get, silently skips set/del). This keeps the
 * demo functional without Redis.
 */

function isConfigured() {
  return !!(UPSTASH_URL && UPSTASH_TOKEN);
}

async function redisCommand(command) {
  if (!isConfigured()) return null;

  try {
    const res = await axios.post(UPSTASH_URL, command, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    });
    return res.data?.result ?? null;
  } catch (err) {
    console.warn('Redis error:', err.message);
    return null;
  }
}

/**
 * Get a cached value by key. Returns parsed JSON or null.
 */
async function get(key) {
  const raw = await redisCommand(['GET', key]);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/**
 * Set a value with optional TTL (in seconds).
 */
async function set(key, value, ttlSeconds) {
  const json = JSON.stringify(value);
  if (ttlSeconds) {
    return redisCommand(['SET', key, json, 'EX', String(ttlSeconds)]);
  }
  return redisCommand(['SET', key, json]);
}

/**
 * Delete a key from cache.
 */
async function del(key) {
  return redisCommand(['DEL', key]);
}

module.exports = { get, set, del, isConfigured };
