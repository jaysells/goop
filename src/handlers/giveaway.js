const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const store = require('../utils/store');
const { giveawayEmbed, baseEmbed, COLOR_SUCCESS } = require('../utils/embeds');

function joinRow(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('giveaway_join')
      .setLabel('Enter Giveaway')
      .setEmoji('🎉')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled)
  );
}

async function createGiveaway(interaction, prize, durationMs) {
  const endsAt = Date.now() + durationMs;

  const msg = await interaction.channel.send({
    embeds: [giveawayEmbed({ prize, endsAt, hostId: interaction.user.id, participantCount: 0 })],
    components: [joinRow()],
  });

  await store.saveGiveaway(msg.id, {
    messageId: msg.id,
    channelId: msg.channel.id,
    guildId: interaction.guild.id,
    prize,
    hostId: interaction.user.id,
    endsAt,
    participants: [],
    ended: false,
    winnerId: null,
  });

  return msg;
}

async function handleJoinButton(interaction) {
  const giveaway = await store.getGiveaway(interaction.message.id);
  if (!giveaway || giveaway.ended) {
    return interaction.reply({ content: 'This giveaway has ended.', ephemeral: true });
  }

  const idx = giveaway.participants.indexOf(interaction.user.id);
  let joined;
  if (idx === -1) {
    giveaway.participants.push(interaction.user.id);
    joined = true;
  } else {
    giveaway.participants.splice(idx, 1);
    joined = false;
  }
  await store.saveGiveaway(giveaway.messageId, giveaway);

  await interaction.update({
    embeds: [giveawayEmbed({
      prize: giveaway.prize, endsAt: giveaway.endsAt, hostId: giveaway.hostId,
      participantCount: giveaway.participants.length,
    })],
    components: [joinRow()],
  }).catch(async () => {
    // if update fails (e.g. interaction not tied to message edit), fall back to reply
    await interaction.reply({ content: joined ? "You're entered!" : 'You left the giveaway.', ephemeral: true });
  });
}

function pickWinner(participants) {
  if (!participants || participants.length === 0) return null;
  return participants[Math.floor(Math.random() * participants.length)];
}

async function endGiveaway(client, giveaway) {
  const winnerId = pickWinner(giveaway.participants);
  giveaway.ended = true;
  giveaway.winnerId = winnerId;
  await store.saveGiveaway(giveaway.messageId, giveaway);

  try {
    const channel = await client.channels.fetch(giveaway.channelId);
    const msg = await channel.messages.fetch(giveaway.messageId);
    await msg.edit({
      embeds: [giveawayEmbed({
        prize: giveaway.prize, endsAt: giveaway.endsAt, hostId: giveaway.hostId,
        participantCount: giveaway.participants.length, ended: true, winnerId,
      })],
      components: [joinRow(true)],
    });

    if (winnerId) {
      await channel.send(`🎉 <@${winnerId}> won **${giveaway.prize}**! Open a **Giveaway Claim** ticket within 24 hours to claim it.`);
    } else {
      await channel.send(`No valid entries for **${giveaway.prize}** — no winner picked.`);
    }
  } catch (err) {
    console.error('Failed to update ended giveaway message', err);
  }

  if (winnerId) {
    const wonAt = Date.now();
    const expiresAt = wonAt + config.GIVEAWAY_CLAIM_WINDOW_MS;

    await store.saveWinner(winnerId, giveaway.messageId, {
      userId: winnerId,
      messageId: giveaway.messageId,
      prize: giveaway.prize,
      ign: null,
      amount: null,
      wonAt,
      expiresAt,
      claimed: false,
      expiredNotified: false,
    });

    try {
      const user = await client.users.fetch(winnerId);
      const expiresTs = Math.floor(expiresAt / 1000);
      await user.send(
        `🎉 You won **${giveaway.prize}**!\n` +
        `Open a **Giveaway Claim** ticket and provide your IGN + amount to claim it before <t:${expiresTs}:R> (<t:${expiresTs}:f>), or your prize will expire.`
      );
    } catch { /* DMs closed */ }
  }
}

async function rerollGiveaway(interaction, messageId) {
  const giveaway = await store.getGiveaway(messageId);
  if (!giveaway) {
    return interaction.reply({ content: 'Giveaway not found.', ephemeral: true });
  }
  if (giveaway.participants.length === 0) {
    return interaction.reply({ content: 'No participants to reroll from.', ephemeral: true });
  }

  const winnerId = pickWinner(giveaway.participants);
  giveaway.winnerId = winnerId;
  giveaway.ended = true;
  await store.saveGiveaway(messageId, giveaway);

  await interaction.reply({ content: `🎉 New winner for **${giveaway.prize}**: <@${winnerId}>! They have 24 hours to open a Giveaway Claim ticket.` });

  const wonAt = Date.now();
  const expiresAt = wonAt + config.GIVEAWAY_CLAIM_WINDOW_MS;
  await store.saveWinner(winnerId, messageId, {
    userId: winnerId, messageId, prize: giveaway.prize, ign: null, amount: null,
    wonAt, expiresAt, claimed: false, expiredNotified: false,
  });

  try {
    const user = await interaction.client.users.fetch(winnerId);
    const expiresTs = Math.floor(expiresAt / 1000);
    await user.send(
      `🎉 You won a reroll for **${giveaway.prize}**!\n` +
      `Open a **Giveaway Claim** ticket before <t:${expiresTs}:R> (<t:${expiresTs}:f>), or your prize will expire.`
    );
  } catch { /* DMs closed */ }
}

// Called by the scheduler every tick
async function checkExpiredGiveaways(client) {
  const giveaways = await store.getAllGiveaways();
  const now = Date.now();
  for (const g of giveaways) {
    if (!g.ended && g.endsAt <= now) {
      await endGiveaway(client, g).catch((e) => console.error('endGiveaway error', e));
    }
  }
}

module.exports = { createGiveaway, handleJoinButton, endGiveaway, rerollGiveaway, checkExpiredGiveaways, joinRow };
