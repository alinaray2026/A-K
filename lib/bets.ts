import { all, get, run, tx } from "./db.ts";
import { round2, SELECTIONS, type Selection } from "./odds.ts";

export const MIN_STAKE = 1;
export const MAX_SELECTIONS = 20;
export const MAX_WIN = 100000;

export type SlipItem = { matchId: number; selection: string };

/** Places a bet; prices always come from the database, never from the client. */
export function placeBet(userId: number, items: SlipItem[], stakeRaw: number) {
  const stake = round2(Number(stakeRaw));
  if (!Number.isFinite(stake) || stake < MIN_STAKE) throw new Error(`Minimum stake is ${MIN_STAKE}`);
  if (!Array.isArray(items) || items.length === 0) throw new Error("Bet slip is empty");
  if (items.length > MAX_SELECTIONS) throw new Error(`Maximum ${MAX_SELECTIONS} selections`);
  const ids = new Set<number>();
  for (const it of items) {
    if (!SELECTIONS.includes(it.selection as Selection)) throw new Error("Invalid selection");
    if (ids.has(it.matchId)) throw new Error("Only one selection per match");
    ids.add(it.matchId);
  }

  return tx(() => {
    const user = get<{ balance: number }>("SELECT balance FROM users WHERE id = ?", userId);
    if (!user) throw new Error("User not found");
    if (user.balance < stake) throw new Error("Insufficient balance");
    const now = new Date().toISOString();
    const priced = items.map((it) => {
      const row = get<{ price: number; status: string; kickoff: string }>(
        `SELECT o.price, m.status, m.kickoff FROM odds o JOIN matches m ON m.id = o.match_id
         WHERE o.match_id = ? AND o.selection = ?`, it.matchId, it.selection);
      if (!row) throw new Error("Match not found");
      if (row.status !== "scheduled" || row.kickoff <= now) throw new Error("Betting on this match is closed");
      return { ...it, price: row.price };
    });
    const totalOdds = round2(priced.reduce((p, s) => p * s.price, 1));
    const potential = Math.min(MAX_WIN, round2(stake * totalOdds));
    run("UPDATE users SET balance = round(balance - ?, 2) WHERE id = ?", stake, userId);
    const r = run("INSERT INTO bets (user_id, stake, total_odds, potential_win) VALUES (?, ?, ?, ?)",
      userId, stake, totalOdds, potential);
    const betId = Number(r.lastInsertRowid);
    for (const s of priced) {
      run("INSERT INTO bet_selections (bet_id, match_id, selection, price) VALUES (?, ?, ?, ?)",
        betId, s.matchId, s.selection, s.price);
    }
    return { betId, totalOdds, potential };
  });
}

export function listOpenMatches() {
  const matches = all<{ id: number; league: string; home: string; away: string; kickoff: string }>(
    `SELECT id, league, home, away, kickoff FROM matches
     WHERE status = 'scheduled' AND kickoff > ? ORDER BY kickoff, id`, new Date().toISOString());
  const odds = all<{ match_id: number; selection: string; price: number }>(
    "SELECT o.match_id, o.selection, o.price FROM odds o JOIN matches m ON m.id = o.match_id WHERE m.status = 'scheduled'");
  const byMatch = new Map<number, Record<string, number>>();
  for (const o of odds) {
    if (!byMatch.has(o.match_id)) byMatch.set(o.match_id, {});
    byMatch.get(o.match_id)![o.selection] = o.price;
  }
  return matches.map((m) => ({ ...m, odds: byMatch.get(m.id) ?? {} }));
}
export type OpenMatch = ReturnType<typeof listOpenMatches>[number];
