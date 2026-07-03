const { SlashCommandBuilder } = require('discord.js');
const { requireStaff } = require('../utils/permissions');
const { buildBillionPanel } = require('../utils/panels');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('billionairepanel')
    .setDescription('Deploy the billionaire-tier ticket panel (buy/sell/support) in this channel.'),
  async execute(interaction) {
    if (!(await requireStaff(interaction))) return;
    const panel = buildBillionPanel();
    await interaction.channel.send(panel);
    await interaction.reply({ content: 'Billionaire ticket panel deployed.', ephemeral: true });
  },
};
