const { SlashCommandBuilder } = require('discord.js');
const { requireStaff } = require('../utils/permissions');
const { parseDuration } = require('../utils/time');
const { createGiveaway } = require('../handlers/giveaway');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gcreate')
    .setDescription('Create a giveaway.')
    .addStringOption((opt) => opt.setName('prize').setDescription('What are you giving away?').setRequired(true))
    .addStringOption((opt) => opt.setName('time').setDescription('Duration, e.g. 1h, 2d, 30m').setRequired(true)),
  async execute(interaction) {
    if (!(await requireStaff(interaction))) return;

    const prize = interaction.options.getString('prize');
    const timeStr = interaction.options.getString('time');
    const durationMs = parseDuration(timeStr);

    if (!durationMs || durationMs <= 0) {
      return interaction.reply({ content: 'Invalid duration. Use formats like `1h`, `30m`, `2d`.', ephemeral: true });
    }

    await interaction.reply({ content: 'Giveaway created!', ephemeral: true });
    await createGiveaway(interaction, prize, durationMs);
  },
};
