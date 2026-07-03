const { SlashCommandBuilder } = require('discord.js');
const { requireStaff } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member.')
    .addUserOption((opt) => opt.setName('user').setDescription('Member to kick').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason').setRequired(false)),
  async execute(interaction) {
    if (!(await requireStaff(interaction))) return;

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ content: 'Member not found in this server.', ephemeral: true });
    if (!member.kickable) return interaction.reply({ content: "I can't kick this member (role hierarchy).", ephemeral: true });

    await member.kick(reason);
    await interaction.reply(`👢 Kicked <@${user.id}> — ${reason}`);
  },
};
