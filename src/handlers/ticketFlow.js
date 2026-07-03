const {
  ChannelType, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder,
} = require('discord.js');
const config = require('../config');
const { buildModal, TYPE_LABELS } = require('../utils/modals');
const { ticketOpenEmbed, logEmbed, baseEmbed, COLOR_FAIL, COLOR_SUCCESS } = require('../utils/embeds');
const store = require('../utils/store');

// panel -> which config category the resulting ticket goes into, keyed by ticket type
function resolveCategory(panel, type) {
  if (panel === 'billion') return config.CATEGORIES.BILLIONAIRE;
  if (panel === 'apply') return config.CATEGORIES.SUPPORT_APPLY; // application tickets live in the support/apply category
  // panel === 'ticket'
  if (type === 'giveaway_claim') return config.CATEGORIES.GIVEAWAY_CLAIM;
  if (type === 'support') return config.CATEGORIES.SUPPORT_APPLY;
  return config.CATEGORIES.BUY_SELL; // buy_spawners / sell_spawners
}

function channelNameFor(panel, type, username) {
  const cleanUser = username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user';
  const typeSlug = {
    buy_spawners: 'buy',
    sell_spawners: 'sell',
    giveaway_claim: 'giveaway-claim',
    support: 'support',
    application: 'application',
  }[type] || type;
  const prefix = panel === 'billion' ? 'billion' : typeSlug;
  return panel === 'billion' ? `billion-${typeSlug}-${cleanUser}` : `${prefix}-${cleanUser}`;
}

// ---------- Select menu handlers (ticketpanel_select / billionpanel_select) ----------
async function handleSelectMenu(interaction) {
  const panel = interaction.customId === 'ticketpanel_select' ? 'ticket'
    : interaction.customId === 'billionpanel_select' ? 'billion' : null;
  if (!panel) return;

  const type = interaction.values[0];
  const modal = buildModal(panel, type);
  await interaction.showModal(modal);
}

// ---------- Button handler (applypanel_button) ----------
async function handleApplyButton(interaction) {
  const modal = buildModal('apply', 'application');
  await interaction.showModal(modal);
}

// ---------- Modal submit -> create the ticket channel ----------
async function handleModalSubmit(interaction) {
  // customId format is modal_<panel>_<type> — split on underscores
  const parts = interaction.customId.split('_');
  const modalPanel = parts[1]; // ticket | billion | apply
  const modalType = parts.slice(2).join('_'); // buy_spawners / sell_spawners / giveaway_claim / support / application

  await interaction.deferReply({ ephemeral: true });

  const answers = {};
  interaction.fields.fields.forEach((field, key) => {
    answers[key] = field.value;
  });

  const categoryId = resolveCategory(modalPanel, modalType);
  const guild = interaction.guild;
  const staffRoleId = config.STAFF_ROLE_ID;

  const channelName = channelNameFor(modalPanel, modalType, interaction.user.username);

  let channel;
  try {
    channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: categoryId,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        { id: staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      ],
    });
  } catch (err) {
    console.error('Failed to create ticket channel', err);
    return interaction.editReply('Failed to create your ticket channel. Please contact staff directly.');
  }

  const typeLabel = TYPE_LABELS[modalType] || modalType;

  await store.saveTicket(channel.id, {
    channelId: channel.id,
    guildId: guild.id,
    panel: modalPanel,
    type: modalType,
    userId: interaction.user.id,
    answers,
    createdAt: Date.now(),
  });

  await channel.send({
    content: `<@${interaction.user.id}> <@&${staffRoleId}>`,
    embeds: [ticketOpenEmbed({ typeLabel, user: interaction.user, answers: humanizeAnswers(modalType, answers) })],
  });

  // log
  await sendLog(guild, 'open', channelName, interaction.user, { Type: typeLabel });

  await interaction.editReply(`Your ticket has been created: <#${channel.id}>`);

  // Special handling: giveaway claim tickets get auto-checked against recent winners
  if (modalType === 'giveaway_claim') {
    await handleGiveawayClaimCheck(channel, interaction.user, answers, staffRoleId);
  }
}

function humanizeAnswers(type, raw) {
  const labelMap = {
    ign: 'IGN', spawner_type: 'Type of Spawners', amount: 'Amount', issue: 'Issue', bal: 'Balance', items: 'Items',
  };
  const out = {};
  for (const [k, v] of Object.entries(raw)) out[labelMap[k] || k] = v;
  return out;
}

// ---------- Giveaway claim auto-check ----------
// Only the Discord user ID matters here — whatever IGN/amount they typed in the form
// is just shown to staff, it is not used to validate the win.
async function handleGiveawayClaimCheck(channel, user, answers, staffRoleId) {
  const winners = await store.getWinnersForUser(user.id);
  const now = Date.now();
  const recentWindow = 24 * 60 * 60 * 1000;

  const match = winners.find((w) => now - w.wonAt <= recentWindow && !w.claimed);

  if (match) {
    await store.markWinnerClaimed(user.id, match.messageId);
    await channel.send({
      embeds: [baseEmbed()
        .setColor(COLOR_SUCCESS)
        .setTitle('✅ Winner Confirmed')
        .setDescription(`<@${user.id}> confirmed as the winner of **${match.prize}**. A staff member will assist with the payout shortly.`)],
      content: `<@&${staffRoleId}>`,
    });
    return;
  }

  // No match — close the ticket and DM the user
  await channel.send({
    embeds: [baseEmbed()
      .setColor(COLOR_FAIL)
      .setTitle('❌ No Matching Win Found')
      .setDescription('No matching giveaway win was found for the info provided within the last 24 hours. This ticket will close shortly.')],
  });

  try {
    await user.send("You didn't win, or the prize claim window has expired.");
  } catch { /* DMs closed */ }

  setTimeout(async () => {
    try {
      await store.deleteTicket(channel.id);
      await sendLog(channel.guild, 'close', channel.name, user, { Reason: 'No matching win' });
      await channel.delete('Giveaway claim ticket - no matching win');
    } catch (err) {
      console.error('Failed to auto-close giveaway claim ticket', err);
    }
  }, 5000);
}

// ---------- Rename ----------
async function renameTicket(channel, newName) {
  const clean = newName.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 90);
  await channel.setName(clean);
  return clean;
}

// ---------- Close (with reason picker) ----------
function buildCloseReasonRow() {
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticketclose_reason')
      .setPlaceholder('Select a close reason...')
      .addOptions(config.TICKET_CLOSE_REASONS)
  );
  return row;
}

async function finalizeTicketClose(interaction, reasonLabel) {
  const channel = interaction.channel;
  const ticket = await store.getTicket(channel.id);

  await interaction.reply({ content: `Closing ticket... Reason: **${reasonLabel}**`, ephemeral: false });

  await sendLog(interaction.guild, 'close', channel.name, interaction.user, { Reason: reasonLabel });

  if (ticket) {
    try {
      const ticketOwner = await interaction.client.users.fetch(ticket.userId);
      await ticketOwner.send(
        `Your ticket **${channel.name}** was closed at <t:${Math.floor(Date.now() / 1000)}:f>.\nReason: ${reasonLabel}`
      );
    } catch { /* DMs closed */ }
    await store.deleteTicket(channel.id);
  }

  setTimeout(() => channel.delete('Ticket closed').catch(() => {}), 5000);
}

async function sendLog(guild, action, ticketName, user, extra) {
  try {
    const logChannel = await guild.channels.fetch(config.LOG_CHANNEL_ID);
    if (logChannel) await logChannel.send({ embeds: [logEmbed({ action, ticketName, user, extra })] });
  } catch (err) {
    console.error('Failed to send ticket log', err);
  }
}

module.exports = {
  handleSelectMenu,
  handleApplyButton,
  handleModalSubmit,
  renameTicket,
  buildCloseReasonRow,
  finalizeTicketClose,
  sendLog,
};
