const { SlashCommandBuilder } = require('discord.js');
const { requireStaff } = require('../utils/permissions');
const { buildApplyPanel } = require('../utils/panels');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('applypanel')
    .setDescription('Deploy the application ticket panel in this channel.'),
  async execute(interaction) {
    if (!(await requireStaff(interaction))) return;
    const panel = buildApplyPanel();
    await interaction.channel.send(panel);
    await interaction.reply({ content: 'Application panel deployed.', ephemeral: true });
  },
};
