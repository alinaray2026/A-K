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
