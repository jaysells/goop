const { SlashCommandBuilder } = require('discord.js');
const { requireStaff } = require('../utils/permissions');
const { renameTicket } = require('../handlers/ticketFlow');
const store = require('../utils/store');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('renameticket')
    .setDescription('Rename the current ticket channel.')
    .addStringOption((opt) => opt.setName('name').setDescription('New name for the ticket').setRequired(true)),
  async execute(interaction) {
    if (!(await requireStaff(interaction))) return;

    const ticket = await store.getTicket(interaction.channel.id);
    if (!ticket) {
      return interaction.reply({ content: 'This command can only be used inside a ticket channel.', ephemeral: true });
    }

    const newName = interaction.options.getString('name');
    const applied = await renameTicket(interaction.channel, newName);
    await interaction.reply(`Ticket renamed to **${applied}**.`);
  },
};
