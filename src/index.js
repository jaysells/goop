require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');

const config = require('./config');
const ticketFlow = require('./handlers/ticketFlow');
const giveaway = require('./handlers/giveaway');
const billion = require('./handlers/billion');
const { requireStaff } = require('./utils/permissions');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  // background scheduler: giveaway expiry + billionaire role expiry
  setInterval(() => {
    giveaway.checkExpiredGiveaways(client).catch((e) => console.error('giveaway scheduler error', e));
    billion.checkExpiredBillionGrants(client).catch((e) => console.error('billion scheduler error', e));
  }, config.SCHEDULER_INTERVAL_MS);
});

client.on('guildMemberAdd', async (member) => {
  try {
    await member.roles.add(config.AUTO_JOIN_ROLE_ID, 'Auto-role on join');
  } catch (err) {
    console.error(`Failed to add auto-join role to ${member.id}`, err);
  }
});

client.on('interactionCreate', async (interaction) => {
  try {
    // ---- Slash commands ----
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      return command.execute(interaction);
    }

    // ---- Autocomplete ----
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command?.autocomplete) return command.autocomplete(interaction);
      return;
    }

    // ---- String select menus ----
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'ticketpanel_select' || interaction.customId === 'billionpanel_select') {
        return ticketFlow.handleSelectMenu(interaction);
      }
      if (interaction.customId === 'ticketclose_reason') {
        if (!(await requireStaff(interaction))) return;
        const reasonLabel = config.TICKET_CLOSE_REASONS.find((r) => r.value === interaction.values[0])?.label || interaction.values[0];
        return ticketFlow.finalizeTicketClose(interaction, reasonLabel);
      }
      return;
    }

    // ---- Buttons ----
    if (interaction.isButton()) {
      if (interaction.customId === 'applypanel_button') {
        return ticketFlow.handleApplyButton(interaction);
      }
      if (interaction.customId === 'giveaway_join') {
        return giveaway.handleJoinButton(interaction);
      }
      return;
    }

    // ---- Modal submissions ----
    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('modal_')) {
        return ticketFlow.handleModalSubmit(interaction);
      }
      return;
    }
  } catch (err) {
    console.error('Interaction handling error:', err);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'Something went wrong handling that.', ephemeral: true }).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
