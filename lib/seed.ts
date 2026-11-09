import type { DatabaseSync } from "node:sqlite";
import { expectedGoals, oddsFor } from "./odds.ts";

export const LEAGUES: Record<string, Record<string, number>> = {
  "Kosovo · Superliga": { Ballkani: 78, Drita: 74, Prishtina: 72, Llapi: 70, Gjilani: 66, Malisheva: 62, Dukagjini: 60, Ferizaj: 58 },
  "Albania · Abissnet Superiore": { Egnatia: 76, Partizani: 74, Tirana: 72, Vllaznia: 71, "Dinamo City": 68, Teuta: 66, Elbasani: 61, Bylis: 60 },
  "England · Premier League": { Arsenal: 92, "Manchester City": 92, Liverpool: 91, Chelsea: 86, "Newcastle Utd": 84, "Aston Villa": 82, Brighton: 79, Everton: 74 },
  "Italy · Serie A": { Inter: 90, Napoli: 87, Juventus: 86, Milan: 84, Atalanta: 84, Roma: 81, Lazio: 80, Bologna: 78 },
  "Spain · La Liga": { "Real Madrid": 93, Barcelona: 92, "Atlético Madrid": 87, "Athletic Club": 82, Villarreal: 81, "Real Sociedad": 79, Betis: 79, Sevilla: 76 },
};

function shuffle<T>(a: T[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Creates one round of matches per league over the coming days. */
export function generateRound(db: DatabaseSync) {
  const insM = db.prepare(
    "INSERT INTO matches (league, home, away, kickoff, home_xg, away_xg) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const insO = db.prepare("INSERT INTO odds (match_id, selection, price) VALUES (?, ?, ?)");
  const slots = [15, 17, 18, 19, 20, 21];
  let n = 0;
  for (const [league, teams] of Object.entries(LEAGUES)) {
    const names = shuffle(Object.keys(teams));
    for (let i = 0; i < names.length; i += 2) {
      const home = names[i], away = names[i + 1];
      const d = new Date();
      d.setUTCDate(d.getUTCDate() + 1 + Math.floor(Math.random() * 4));
      d.setUTCHours(slots[Math.floor(Math.random() * slots.length)], Math.random() < 0.5 ? 0 : 30, 0, 0);
      const xg = expectedGoals(teams[home], teams[away]);
      const r = insM.run(league, home, away, d.toISOString(), xg.home, xg.away);
      for (const [sel, price] of Object.entries(oddsFor(xg.home, xg.away))) {
        insO.run(Number(r.lastInsertRowid), sel, price);
      }
      n++;
    }
  }
  return n;
}

export function seed(db: DatabaseSync) {
  generateRound(db);
}
