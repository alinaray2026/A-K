# GolBet — platformë demo për baste futbolli

Platformë demo me **pikë virtuale** (pa para reale). Ndërtuar me Next.js 15 + SQLite (`node:sqlite`, pa varësi native).

## Nisja

```bash
npm install
npm run dev          # http://localhost:3000
```

Për produksion: `npm run build && npm start`. Testet: `npm test`.

Kërkon Node.js 22.13+ (për `node:sqlite`). Databaza krijohet automatikisht te `data/bast.db`
me ndeshje shembull. Për ta rinisur nga zero, fshini dosjen `data/`.

**Admini:** `admin` / `admin123` (ndryshojeni me `ADMIN_PASSWORD=... ` para nisjes së parë).

## Çfarë ka

- Lista e ndeshjeve sipas ligës, me tregjet **1X2**, **Mbi/Nën 2.5** dhe **GG/NG**
- Kupon basti: tek ose kombinim (deri në 20 zgjedhje, një për ndeshje), shuma të shpejta
- Llogari me regjistrim/hyrje, 1,000 pikë fillestare + bonus ditor 100 pikë
- Bastet e mia (në pritje / fituar / humbur / kthyer) dhe renditja e lojtarëve
- Paneli i adminit: shto ndeshje (koeficientët llogariten vetë nga vlerësimi i ekipeve),
  vendos rezultatin, simulo rezultatin, anulo ndeshjen, gjenero xhiro të re

## Si funksionon

- `lib/odds.ts` — modeli Poisson: vlerësimet → golat e pritur → probabilitetet → koeficientët (marzh 6%)
- `lib/bets.ts` — vendosja e bastit në transaksion; koeficientët merren nga serveri, jo nga klienti
- `lib/settle.ts` — shlyerja: një zgjedhje e humbur = kupon i humbur; zgjedhjet e anuluara llogariten 1.00
- `app/actions.ts` — server actions për hyrjen, bastet dhe adminin
