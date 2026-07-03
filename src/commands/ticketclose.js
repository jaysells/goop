const { SlashCommandBuilder } = require('discord.js');
const { requireStaff } = require('../utils/permissions');
const { buildCloseReasonRow } = require('../handlers/ticketFlow');
const store = require('../utils/store');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketclose')
    .setDescription('Close the current ticket (pick a reason).'),
  async execute(interaction) {
    if (!(await requireStaff(interaction))) return;

    const ticket = await store.getTicket(interaction.channel.id);
    if (!ticket) {
      return interaction.reply({ content: 'This command can only be used inside a ticket channel.', ephemeral: true });
    }

    await interaction.reply({
      content: 'Select a reason for closing this ticket:',
      components: [buildCloseReasonRow()],
      ephemeral: true,
    });
  },
};
