# Ticket / Giveaway / Billionaire Role Bot

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `DISCORD_TOKEN`, `CLIENT_ID` (and `GUILD_ID` for instant dev command updates — omit for global/prod)
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
3. `npm run deploy` — registers slash commands
4. `npm start` — runs the bot

For Railway: set the same env vars in the project, deploy, start command `npm start`. Run `npm run deploy` once (locally or as a one-off Railway job) any time you change command definitions.

## Commands
| Command | Who | What |
|---|---|---|
| `/ticketpanel` | staff | Deploys panel: Buy Spawners, Sell Spawners, Giveaway Claim, Support |
| `/billionairepanel` | staff | Deploys panel: Buy Spawners, Sell Spawners, Support (no giveaway claim) |
| `/applypanel` | staff | Deploys the Application Ticket button |
| `/renameticket <name>` | staff, in-ticket | Renames the ticket channel |
| `/ticketclose` | staff, in-ticket | Prompts a close-reason dropdown, then closes |
| `/gcreate <prize> <time>` | staff | Starts a giveaway (e.g. `time: 1h`, `2d`, `30m`) |
| `/greroll <giveaway>` | staff | Rerolls a winner (autocomplete lists recent giveaways) |
| `/givebillion <user1..user10>` | staff | Grants the Billionaire role to up to 10 users for 5 days |
| `/kick /ban /timeout` | staff | Standard moderation |
| `/admin <passcode>` | **everyone** | Correct passcode (`0725`) grants the staff role. Not staff-gated by design — it's how staff role is obtained. |

## How tickets work
- Each panel type shows a select menu (or button for applications) → opens a modal with the relevant questions → creates a private channel under the matching category → pings staff.
- Every open/close is logged to the log channel and DMed to the ticket owner on close.
- **Giveaway Claim tickets** are auto-checked: the IGN + amount submitted are matched against your unclaimed wins from the last 24 hours. Match → ticket stays open with a staff ping for payout. No match → ticket auto-closes in 5s and the user is DMed that they didn't win / the window expired.

## Giveaways
- `/gcreate` posts an embed with a native Discord countdown timestamp and an "Enter Giveaway 🎉" button (toggles entry).
- A background scheduler (checks every 60s, survives restarts since state lives in Redis) ends giveaways once their time is up, picks a random entrant, and DMs the winner with a 24-hour claim countdown.
- `/greroll` picks a new random winner from the same entrant pool and restarts their 24h claim window.

## Billionaire role
- `/givebillion` grants the role and stores an expiry timestamp in Redis.
- The same background scheduler removes the role after 5 days and DMs the user to reapply. This is restart-safe — it doesn't rely on `setTimeout`, which would be lost on a Railway redeploy.

## Judgment calls made (spec said "use your own judgment")
- **Category assignment**: Buy/Sell → Buy/Sell category; Giveaway Claim → Giveaway Claim category; Support (from `/ticketpanel`) → Support/Apply category; everything from `/billionairepanel` → Billionaire category; Application tickets → Support/Apply category (matches its name).
- **Channel naming**: `<type>-<username>` (e.g. `buy-mini`, `billion-support-mini`, `giveaway-claim-mini`, `application-mini`), lowercased and stripped of invalid characters.
- **Giveaway entry**: used a button instead of a raw reaction for more reliable participant tracking (reactions require extra intents/fetches and are easier to spoof with multiple accounts un-caught).
- **`/givebillion` "5-10 selected members"**: implemented as 10 optional user options (1 required) rather than a hard minimum of 5, since slash commands can't enforce "pick between 5 and 10" natively and forcing a minimum would block legitimate smaller grants.
- **Ticket close**: `/ticketclose` shows an ephemeral dropdown of reasons (Resolved / Completed Trade / User Inactive / Invalid-Spam / Other) — edit `config.TICKET_CLOSE_REASONS` to change these.

## Files
```
src/
  config.js            all IDs / constants — edit here first
  index.js             bot bootstrap + interaction router
  deploy-commands.js   slash command registration
  redis.js             Upstash client + JSON helpers
  commands/            one file per slash command
  handlers/            ticketFlow.js, giveaway.js, billion.js — the actual logic
  utils/               embeds, panels, modals, permissions, time parsing, Redis data access
```
