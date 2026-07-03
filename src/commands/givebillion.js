const { SlashCommandBuilder } = require('discord.js');
const { requireStaff } = require('../utils/permissions');
const { grantBillion } = require('../handlers/billion');

module.exports = {
  data: (() => {
    const builder = new SlashCommandBuilder()
      .setName('givebillion')
      .setDescription('Grant the Billionaire role to up to 10 members for 5 days.');
    builder.addUserOption((opt) => opt.setName('user1').setDescription('Member to grant').setRequired(true));
    for (let i = 2; i <= 10; i++) {
      builder.addUserOption((opt) => opt.setName(`user${i}`).setDescription('Member to grant').setRequired(false));
    }
    return builder;
  })(),
  async execute(interaction) {
    if (!(await requireStaff(interaction))) return;

    const userIds = [];
    for (let i = 1; i <= 10; i++) {
      const user = interaction.options.getUser(`user${i}`);
      if (user) userIds.push(user.id);
    }

    await interaction.deferReply({ ephemeral: true });
    const results = await grantBillion(interaction.guild, userIds);

    const ok = results.filter((r) => r.ok).map((r) => `<@${r.userId}>`);
    const failed = results.filter((r) => !r.ok).map((r) => `<@${r.userId}>`);

    let msg = ok.length ? `Granted Billionaire role (5 days) to: ${ok.join(', ')}` : 'No roles granted.';
    if (failed.length) msg += `\nFailed for: ${failed.join(', ')}`;

    await interaction.editReply(msg);
  },
};
