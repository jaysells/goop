const { EmbedBuilder } = require('discord.js');

const COLOR = 0x2b2d31;
const COLOR_SUCCESS = 0x57f287;
const COLOR_FAIL = 0xed4245;

function baseEmbed() {
  return new EmbedBuilder().setColor(COLOR).setTimestamp();
}

function panelEmbed(title, description) {
  return baseEmbed().setTitle(title).setDescription(description);
}

function ticketOpenEmbed({ typeLabel, user, answers }) {
  const e = baseEmbed()
    .setTitle(`🎫 ${typeLabel}`)
    .setDescription(`Opened by <@${user.id}>`)
    .setColor(COLOR);
  for (const [field, value] of Object.entries(answers)) {
    e.addFields({ name: field, value: value || 'N/A', inline: true });
  }
  return e;
}

function logEmbed({ action, ticketName, user, extra }) {
  const e = baseEmbed()
    .setTitle(action === 'open' ? '🟢 Ticket Opened' : '🔴 Ticket Closed')
    .setColor(action === 'open' ? COLOR_SUCCESS : COLOR_FAIL)
    .addFields(
      { name: 'Ticket', value: ticketName, inline: true },
      { name: 'User', value: `<@${user.id}> (${user.tag})`, inline: true },
    );
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      e.addFields({ name: k, value: String(v), inline: true });
    }
  }
  return e;
}

function giveawayEmbed({ prize, endsAt, hostId, participantCount = 0, ended = false, winnerId = null }) {
  const endsTs = Math.floor(endsAt / 1000);
  const e = baseEmbed()
    .setTitle(ended ? '🎉 Giveaway Ended' : '🎉 Giveaway')
    .setDescription(
      `**Prize:** ${prize}\n` +
      `**Hosted by:** <@${hostId}>\n` +
      (ended
        ? `**Winner:** ${winnerId ? `<@${winnerId}>` : 'No valid entries'}`
        : `**Ends:** <t:${endsTs}:R> (<t:${endsTs}:f>)`)
    )
    .setFooter({ text: `Entries: ${participantCount} • React 🎉 to enter` });
  return e;
}

module.exports = { baseEmbed, panelEmbed, ticketOpenEmbed, logEmbed, giveawayEmbed, COLOR, COLOR_SUCCESS, COLOR_FAIL };
