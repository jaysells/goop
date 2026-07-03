const config = require('../config');

function isStaff(interaction) {
  return interaction.member?.roles?.cache?.has(config.STAFF_ROLE_ID) ?? false;
}

// Returns true if allowed to proceed. If not, replies with an ephemeral error and returns false.
async function requireStaff(interaction) {
  if (isStaff(interaction)) return true;
  await interaction.reply({ content: 'You need the staff role to use this command.', ephemeral: true });
  return false;
}

module.exports = { isStaff, requireStaff };
