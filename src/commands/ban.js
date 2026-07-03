const { SlashCommandBuilder } = require('discord.js');
const { requireStaff } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member.')
    .addUserOption((opt) => opt.setName('user').setDescription('Member to ban').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason').setRequired(false))
    .addIntegerOption((opt) => opt.setName('delete_days').setDescription('Days of messages to delete (0-7)').setRequired(false)),
  async execute(interaction) {
    if (!(await requireStaff(interaction))) return;

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') ?? 0;

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (member && !member.bannable) return interaction.reply({ content: "I can't ban this member (role hierarchy).", ephemeral: true });

    await interaction.guild.members.ban(user.id, { deleteMessageSeconds: Math.min(Math.max(deleteDays, 0), 7) * 86400, reason });
    await interaction.reply(`🔨 Banned <@${user.id}> — ${reason}`);
  },
};
