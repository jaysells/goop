const config = require('../config');
const store = require('../utils/store');

async function grantBillion(guild, userIds) {
  const results = [];
  const grantedAt = Date.now();
  const expiresAt = grantedAt + config.BILLION_ROLE_DURATION_MS;

  for (const userId of userIds) {
    try {
      const member = await guild.members.fetch(userId);
      await member.roles.add(config.BILLIONAIRE_ROLE_ID, 'Granted via /givebillion');
      await store.saveBillionGrant(userId, { userId, grantedAt, expiresAt });
      results.push({ userId, ok: true });
    } catch (err) {
      console.error(`Failed to grant billionaire role to ${userId}`, err);
      results.push({ userId, ok: false, error: err.message });
    }
  }
  return results;
}

async function checkExpiredBillionGrants(client) {
  const grants = await store.getAllBillionGrants();
  const now = Date.now();
  for (const grant of grants) {
    if (grant.expiresAt <= now) {
      await expireBillionGrant(client, grant).catch((e) => console.error('expireBillionGrant error', e));
    }
  }
}

async function expireBillionGrant(client, grant) {
  try {
    // find the guild via cache (bot is presumably single-guild or we scan cached guilds)
    for (const guild of client.guilds.cache.values()) {
      const member = await guild.members.fetch(grant.userId).catch(() => null);
      if (member && member.roles.cache.has(config.BILLIONAIRE_ROLE_ID)) {
        await member.roles.remove(config.BILLIONAIRE_ROLE_ID, 'Billionaire role expired (5 days)');
      }
    }
  } catch (err) {
    console.error('Failed to remove expired billionaire role', err);
  }

  try {
    const user = await client.users.fetch(grant.userId);
    await user.send('Your Billionaire role has expired after 5 days. Please reapply if you would like it back.');
  } catch { /* DMs closed */ }

  await store.deleteBillionGrant(grant.userId);
}

module.exports = { grantBillion, checkExpiredBillionGrants };
