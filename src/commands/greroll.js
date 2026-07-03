const { SlashCommandBuilder } = require('discord.js');
const { requireStaff } = require('../utils/permissions');
const { rerollGiveaway } = require('../handlers/giveaway');
const store = require('../utils/store');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('greroll')
    .setDescription('Reroll a giveaway winner.')
    .addStringOption((opt) =>
      opt.setName('giveaway')
        .setDescription('The giveaway to reroll')
        .setRequired(true)
        .setAutocomplete(true)
    ),
  async execute(interaction) {
    if (!(await requireStaff(interaction))) return;
    const messageId = interaction.options.getString('giveaway');
    await rerollGiveaway(interaction, messageId);
  },
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const giveaways = await store.getAllGiveaways();
    const filtered = giveaways
      .filter((g) => g.prize.toLowerCase().includes(focused.toLowerCase()))
      .slice(0, 25)
      .map((g) => ({ name: `${g.prize} (${g.ended ? 'ended' : 'active'})`, value: g.messageId }));
    await interaction.respond(filtered);
  },
};
