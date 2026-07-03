const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

// field defs per logical ticket type
const FIELD_DEFS = {
  buy_spawners: [
    { id: 'ign', label: 'IGN', style: TextInputStyle.Short },
    { id: 'spawner_type', label: 'Type of Spawners', style: TextInputStyle.Short },
    { id: 'amount', label: 'Amount of Spawners', style: TextInputStyle.Short },
  ],
  sell_spawners: [
    { id: 'ign', label: 'IGN', style: TextInputStyle.Short },
    { id: 'spawner_type', label: 'Type of Spawners', style: TextInputStyle.Short },
    { id: 'amount', label: 'Amount of Spawners', style: TextInputStyle.Short },
  ],
  giveaway_claim: [
    { id: 'ign', label: 'IGN', style: TextInputStyle.Short },
    { id: 'amount', label: 'Amount Won', style: TextInputStyle.Short },
  ],
  support: [
    { id: 'issue', label: 'What is your issue?', style: TextInputStyle.Paragraph },
  ],
  application: [
    { id: 'ign', label: 'IGN', style: TextInputStyle.Short },
    { id: 'bal', label: 'Balance', style: TextInputStyle.Short },
    { id: 'items', label: 'Items', style: TextInputStyle.Paragraph },
  ],
};

const TYPE_LABELS = {
  buy_spawners: 'Buy Spawners',
  sell_spawners: 'Sell Spawners',
  giveaway_claim: 'Giveaway Claim',
  support: 'Support',
  application: 'Application',
};

// panel = 'ticket' | 'billion' | 'apply'  (encodes where the ticket should be filed / which category)
function buildModal(panel, type) {
  const fields = FIELD_DEFS[type];
  const modal = new ModalBuilder()
    .setCustomId(`modal_${panel}_${type}`)
    .setTitle(TYPE_LABELS[type]);

  const rows = fields.map((f) =>
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId(f.id)
        .setLabel(f.label)
        .setStyle(f.style)
        .setRequired(true)
    )
  );
  modal.addComponents(...rows);
  return modal;
}

module.exports = { buildModal, FIELD_DEFS, TYPE_LABELS };
