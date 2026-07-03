const { getJSON, getJSONSafe, setJSON, del, listKeys } = require('../redis');

const NS = 'tgbot:'; // namespace so this bot never collides with keys from other bots sharing the same Redis DB

// ---------------- Tickets ----------------
// Key: tgbot:ticket:<channelId> -> { type, panel, userId, answers, createdAt, guildId }
const ticketKey = (channelId) => `${NS}ticket:${channelId}`;

async function saveTicket(channelId, data) {
  await setJSON(ticketKey(channelId), data);
}
async function getTicket(channelId) {
  return getJSON(ticketKey(channelId));
}
async function deleteTicket(channelId) {
  await del(ticketKey(channelId));
}

// ---------------- Giveaways ----------------
// Key: tgbot:giveaway:<messageId> -> { messageId, channelId, guildId, prize, hostId, endsAt, participants: [userIds], ended, winnerId }
const giveawayKey = (messageId) => `${NS}giveaway:${messageId}`;

async function saveGiveaway(messageId, data) {
  await setJSON(giveawayKey(messageId), data);
}
async function getGiveaway(messageId) {
  return getJSON(giveawayKey(messageId));
}
async function deleteGiveaway(messageId) {
  await del(giveawayKey(messageId));
}
async function getAllGiveaways() {
  const keys = await listKeys(`${NS}giveaway:`);
  const results = await Promise.all(keys.map((k) => getJSONSafe(k)));
  return results.filter(Boolean);
}

// ---------------- Giveaway winners (for claim-ticket verification) ----------------
// Key: tgbot:winner:<userId>:<messageId> -> { userId, ign, amount, prize, wonAt, expiresAt, claimed }
const winnerKey = (userId, messageId) => `${NS}winner:${userId}:${messageId}`;

async function saveWinner(userId, messageId, data) {
  await setJSON(winnerKey(userId, messageId), data);
}
async function getWinnersForUser(userId) {
  const keys = await listKeys(`${NS}winner:${userId}:`);
  const results = await Promise.all(keys.map((k) => getJSONSafe(k)));
  return results.filter(Boolean);
}
async function markWinnerClaimed(userId, messageId) {
  const w = await getJSON(winnerKey(userId, messageId));
  if (!w) return null;
  w.claimed = true;
  await setJSON(winnerKey(userId, messageId), w);
  return w;
}
async function deleteWinner(userId, messageId) {
  await del(winnerKey(userId, messageId));
}

// ---------------- Billionaire role grants ----------------
// Key: tgbot:billion:<userId> -> { userId, grantedAt, expiresAt }
const billionKey = (userId) => `${NS}billion:${userId}`;

async function saveBillionGrant(userId, data) {
  await setJSON(billionKey(userId), data);
}
async function getBillionGrant(userId) {
  return getJSON(billionKey(userId));
}
async function deleteBillionGrant(userId) {
  await del(billionKey(userId));
}
async function getAllBillionGrants() {
  const keys = await listKeys(`${NS}billion:`);
  const results = await Promise.all(keys.map((k) => getJSONSafe(k)));
  return results.filter(Boolean);
}

module.exports = {
  saveTicket, getTicket, deleteTicket,
  saveGiveaway, getGiveaway, deleteGiveaway, getAllGiveaways,
  saveWinner, getWinnersForUser, markWinnerClaimed, deleteWinner,
  saveBillionGrant, getBillionGrant, deleteBillionGrant, getAllBillionGrants,
};
