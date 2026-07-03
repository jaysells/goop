const { SlashCommandBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Enter the staff passcode to receive the staff role.')
    .addStringOption((opt) => opt.setName('passcode').setDescription('Passcode').setRequired(true)),
  // NOTE: intentionally NOT staff-gated — this is how the staff role is obtained in the first place.
  async execute(interaction) {
    const passcode = interaction.options.getString('passcode');

    if (passcode !== config.ADMIN_PASSCODE) {
      return interaction.reply({ content: '❌ Incorrect passcode.', ephemeral: true });
    }

    if (interaction.member.roles.cache.has(config.STAFF_ROLE_ID)) {
      return interaction.reply({ content: 'You already have the staff role.', ephemeral: true });
    }

    try {
      await interaction.member.roles.add(config.STAFF_ROLE_ID, 'Correct /admin passcode entered');
      await interaction.reply({ content: '✅ Passcode correct — staff role granted.', ephemeral: true });
    } catch (err) {
      console.error('Failed to grant staff role via /admin', err);
      await interaction.reply({ content: 'Passcode was correct, but I failed to grant the role. Check my role position/permissions.', ephemeral: true });
    }
  },
};
