module.exports = {
  // Role that gates every ticket-panel/staff command (granted via /admin passcode)
  STAFF_ROLE_ID: '1522127667032494282',
  // Role granted by /givebillion
  BILLIONAIRE_ROLE_ID: '1522127936629772450',
  // Role auto-granted to every new member on join
  AUTO_JOIN_ROLE_ID: '1522127855436169256',

  CATEGORIES: {
    BILLIONAIRE: '1522142081777143898',      // tickets opened from /billionairepanel
    BUY_SELL: '1522142265458298921',          // buy/sell spawner tickets from /ticketpanel
    GIVEAWAY_CLAIM: '1522311834403733706',    // giveaway claim tickets
    SUPPORT_APPLY: '1522311946391781438',     // support tickets (/ticketpanel) + application tickets (/applypanel)
  },

  LOG_CHANNEL_ID: '1522142791457574973',

  ADMIN_PASSCODE: '0725',

  BILLION_ROLE_DURATION_MS: 5 * 24 * 60 * 60 * 1000, // 5 days
  GIVEAWAY_CLAIM_WINDOW_MS: 24 * 60 * 60 * 1000,      // 24 hours

  // How often the background scheduler checks for expired giveaways / billionaire roles
  SCHEDULER_INTERVAL_MS: 60 * 1000, // 1 minute

  TICKET_CLOSE_REASONS: [
    { label: 'Resolved', value: 'resolved' },
    { label: 'Completed Trade', value: 'completed_trade' },
    { label: 'User Inactive', value: 'inactive' },
    { label: 'Invalid / Spam', value: 'invalid' },
    { label: 'Other', value: 'other' },
  ],
};
