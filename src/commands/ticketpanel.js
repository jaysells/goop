const { SlashCommandBuilder } = require('discord.js');
const { requireStaff } = require('../utils/permissions');
const { buildTicketPanel } = require('../utils/panels');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Deploy the buy/sell/giveaway-claim/support ticket panel in this channel.'),
  async execute(interaction) {
    if (!(await requireStaff(interaction))) return;
    const panel = buildTicketPanel();
    await interaction.channel.send(panel);
    await interaction.reply({ content: 'Ticket panel deployed.', ephemeral: true });
  },
};
