const { SlashCommandBuilder } = require('discord.js');
const { requireStaff } = require('../utils/permissions');
const { parseDuration } = require('../utils/time');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member.')
    .addUserOption((opt) => opt.setName('user').setDescription('Member to timeout').setRequired(true))
    .addStringOption((opt) => opt.setName('duration').setDescription('e.g. 10m, 1h, 1d (max 28d)').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason').setRequired(false)),
  async execute(interaction) {
    if (!(await requireStaff(interaction))) return;

    const user = interaction.options.getUser('user');
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const durationMs = parseDuration(durationStr);

    if (!durationMs || durationMs <= 0) {
      return interaction.reply({ content: 'Invalid duration. Use formats like `10m`, `1h`, `1d`.', ephemeral: true });
    }
    const maxMs = 28 * 24 * 60 * 60 * 1000;
    if (durationMs > maxMs) {
      return interaction.reply({ content: 'Timeout duration cannot exceed 28 days.', ephemeral: true });
    }

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ content: 'Member not found in this server.', ephemeral: true });
    if (!member.moderatable) return interaction.reply({ content: "I can't timeout this member (role hierarchy).", ephemeral: true });

    await member.timeout(durationMs, reason);
    await interaction.reply(`⏳ Timed out <@${user.id}> for ${durationStr} — ${reason}`);
  },
};
