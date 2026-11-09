# A&K Bet — football betting demo

A football betting demo with **virtual points** (no real money). Built with Next.js 15 + SQLite (`node:sqlite`, no native dependencies).

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

Production: `npm run build && npm start`. Tests: `npm test`.

Requires Node.js 22.13+ (for `node:sqlite`). The database is created automatically at `data/bast.db`
with sample matches. Delete the `data/` folder to start over.

**Admin:** `admin` / `admin123` (set `ADMIN_PASSWORD=...` before the first start to change it).

`akbet-demo.html` is a standalone single-page version that runs in the browser with no server.

## Deploying (Railway)

1. On railway.com: **New Project → Deploy from GitHub repo** → pick this repo. Build and start commands are detected (`npm run build`, `npm start`).
2. Add a **Volume** to the service, mounted at `/data`, so the database survives restarts and deploys.
3. Under **Variables** set `DB_FILE=/data/bast.db`, `ADMIN_PASSWORD=<a strong password>` (before the first start)
   and `ODDS_API_KEY=<your key from the-odds-api.com>` for real matches, odds and results.
4. Under **Settings → Networking**, click **Generate Domain** to get a public link.

Hosts without a persistent disk (e.g. Render's free tier) will wipe the SQLite database on every restart.

## Real matches (The Odds API)

With `ODDS_API_KEY` set, matches, odds (median across ~20 bookmakers) and final scores come from
[The Odds API](https://the-odds-api.com) instead of sample data. Sync runs automatically on page visits; admins can
also press **Sync now**. Settings (optional):

| Variable | Default | Meaning |
|---|---|---|
| `ODDS_SPORTS` | Serie A, Bundesliga, Premier League, La Liga | comma-separated API sport keys (also `soccer_uefa_champs_league`) |
| `ODDS_SYNC_HOURS` | 24 | how often odds are refreshed (2 credits per league) |
| `SCORES_SYNC_HOURS` | 12 | how often results are checked, only for leagues with a match awaiting its score (2 credits per league) |

The free plan (500 credits/month) covers the defaults; live use needs a paid plan for fresher odds.
The admin panel shows the last sync times and credits left. Put the key in `.env.local` locally (git-ignored), never in code.

## Features

- Matches by league with **1X2**, **Over/Under 2.5** and **GG/NG** markets
- Bet slip: single or accumulator (up to 20 selections, one per match), quick stakes
- English, Italian and German (auto-detected from the browser, switchable in the header)
- Installable as a phone app (PWA): manifest, icons, offline page
- Sign up / log in, 1,000 starting points + 100-point daily bonus
- My bets (pending / won / lost / void) and a leaderboard
- Admin panel: add matches (prices calculated from team ratings), enter scores,
  simulate scores, cancel matches, generate a new round

## How it works

- `lib/odds.ts` — Poisson model: ratings → expected goals → probabilities → prices (6% margin)
- `lib/bets.ts` — places bets in a transaction; prices come from the server, never the client
- `lib/settle.ts` — settlement: one lost leg loses the slip; cancelled legs count as 1.00
- `app/actions.ts` — server actions for auth, betting and admin
- `lib/i18n.ts` — all translations; errors are thrown as codes (`lib/errors.ts`) and translated per user
