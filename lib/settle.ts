import { all, get, run, tx } from "./db.ts";
import { round2, selectionWins, type Selection } from "./odds.ts";

type Sel = { id: number; bet_id: number; selection: Selection; price: number; result: string };

/** Finishes a match with a score and settles affected bets. */
export function settleMatch(matchId: number, hg: number, ag: number) {
  return tx(() => {
    const m = get<{ status: string }>("SELECT status FROM matches WHERE id = ?", matchId);
    if (!m) throw new Error("Match not found");
    if (m.status !== "scheduled") throw new Error("Match is already settled");
    run("UPDATE matches SET status = 'finished', home_goals = ?, away_goals = ? WHERE id = ?", hg, ag, matchId);
    const sels = all<Sel>("SELECT * FROM bet_selections WHERE match_id = ?", matchId);
    for (const s of sels) {
      run("UPDATE bet_selections SET result = ? WHERE id = ?", selectionWins(s.selection, hg, ag) ? "won" : "lost", s.id);
    }
    return resolveBets(sels.map((s) => s.bet_id));
  });
}

/** Cancels a match: its selections become 'void' (price 1.00). */
export function cancelMatch(matchId: number) {
  return tx(() => {
    const m = get<{ status: string }>("SELECT status FROM matches WHERE id = ?", matchId);
    if (!m || m.status !== "scheduled") throw new Error("Match cannot be cancelled");
    run("UPDATE matches SET status = 'cancelled' WHERE id = ?", matchId);
    const sels = all<Sel>("SELECT * FROM bet_selections WHERE match_id = ?", matchId);
    run("UPDATE bet_selections SET result = 'void' WHERE match_id = ?", matchId);
    return resolveBets(sels.map((s) => s.bet_id));
  });
}

function resolveBets(betIds: number[]) {
  let settled = 0;
  for (const betId of new Set(betIds)) {
    const bet = get<{ id: number; user_id: number; stake: number; status: string }>(
      "SELECT id, user_id, stake, status FROM bets WHERE id = ?", betId);
    if (!bet || bet.status !== "open") continue;
    const sels = all<Sel>("SELECT * FROM bet_selections WHERE bet_id = ?", betId);
    let status: string | null = null;
    let payout = 0;
    if (sels.some((s) => s.result === "lost")) status = "lost";
    else if (sels.every((s) => s.result !== "pending")) {
      const won = sels.filter((s) => s.result === "won");
      if (won.length === 0) { status = "void"; payout = bet.stake; }
      else { status = "won"; payout = round2(bet.stake * won.reduce((p, s) => p * s.price, 1)); }
    }
    if (!status) continue;
    run("UPDATE bets SET status = ?, payout = ?, settled_at = datetime('now') WHERE id = ?", status, payout, betId);
    if (payout > 0) run("UPDATE users SET balance = round(balance + ?, 2) WHERE id = ?", payout, bet.user_id);
    settled++;
  }
  return settled;
}
