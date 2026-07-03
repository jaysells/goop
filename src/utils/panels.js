const {
  ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const { panelEmbed } = require('./embeds');

// ----- /ticketpanel : Buy Spawners, Sell Spawners, Giveaway Claim, Support -----
function buildTicketPanel() {
  const embed = panelEmbed(
    '🎫 Support & Trading Tickets',
    'Select an option below to open a ticket.\n\n' +
    '**Buy Spawners** — purchase spawners\n' +
    '**Sell Spawners** — sell spawners to us\n' +
    '**Giveaway Claim** — claim a giveaway you won\n' +
    '**Support** — general help / issues'
  );
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticketpanel_select')
      .setPlaceholder('Select a ticket type...')
      .addOptions(
        { label: 'Buy Spawners', value: 'buy_spawners', emoji: '💰' },
        { label: 'Sell Spawners', value: 'sell_spawners', emoji: '📤' },
        { label: 'Giveaway Claim', value: 'giveaway_claim', emoji: '🎉' },
        { label: 'Support', value: 'support', emoji: '🛠️' },
      )
  );
  return { embeds: [embed], components: [row] };
}

// ----- /billionairepanel : Buy Spawners, Sell Spawners, Support (no giveaway claim) -----
function buildBillionPanel() {
  const embed = panelEmbed(
    '💎 Billionaire Tickets',
    'Select an option below to open a billionaire-tier ticket.\n\n' +
    '**Buy Spawners** — purchase spawners\n' +
    '**Sell Spawners** — sell spawners to us\n' +
    '**Support** — general help / issues'
  );
  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('billionpanel_select')
      .setPlaceholder('Select a ticket type...')
      .addOptions(
        { label: 'Buy Spawners', value: 'buy_spawners', emoji: '💰' },
        { label: 'Sell Spawners', value: 'sell_spawners', emoji: '📤' },
        { label: 'Support', value: 'support', emoji: '🛠️' },
      )
  );
  return { embeds: [embed], components: [row] };
}

// ----- /applypanel : Application Ticket -----
function buildApplyPanel() {
  const embed = panelEmbed(
    '📋 Staff / Billionaire Application',
    'Click the button below to open an application ticket.'
  );
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('applypanel_button')
      .setLabel('Application Ticket')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Primary)
  );
  return { embeds: [embed], components: [row] };
}

module.exports = { buildTicketPanel, buildBillionPanel, buildApplyPanel };
