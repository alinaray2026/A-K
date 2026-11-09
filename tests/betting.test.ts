process.env.DB_FILE = ":memory:";
import { test } from "node:test";
import assert from "node:assert/strict";
import { get, run } from "../lib/db.ts";
import { placeBet } from "../lib/bets.ts";
import { settleMatch, cancelMatch } from "../lib/settle.ts";
import { probabilities, oddsFor } from "../lib/odds.ts";

const user = () => {
  const r = run("INSERT INTO users (username, password_hash, balance) VALUES (?, 'x', 1000)", "u" + Math.random());
  return Number(r.lastInsertRowid);
};
const bal = (id: number) => get<{ balance: number }>("SELECT balance FROM users WHERE id = ?", id)!.balance;
const openMatches = () => (globalThis as any).__db.prepare("SELECT id FROM matches WHERE status='scheduled'").all().map((r: any) => r.id as number);

test("probabilities sum to 1 and prices include margin", () => {
  const p = probabilities(1.6, 1.1);
  assert.ok(Math.abs(p["1"] + p.X + p["2"] - 1) < 1e-6);
  const o = oddsFor(1.6, 1.1);
  const book = 1 / o["1"] + 1 / o.X + 1 / o["2"];
  assert.ok(book > 1.04 && book < 1.08, `overround ${book}`);
});

test("winning accumulator pays stake × odds", () => {
  const u = user();
  const [a, b] = openMatches();
  const r = placeBet(u, [{ matchId: a, selection: "1" }, { matchId: b, selection: "O" }], 100);
  assert.equal(bal(u), 900);
  settleMatch(a, 2, 0);
  assert.equal(get<any>("SELECT status FROM bets WHERE id = ?", r.betId).status, "open");
  settleMatch(b, 2, 1);
  const bet = get<any>("SELECT * FROM bets WHERE id = ?", r.betId);
  assert.equal(bet.status, "won");
  assert.equal(bal(u), Math.round((900 + bet.payout) * 100) / 100);
});

test("one lost leg loses the slip; cancellation refunds", () => {
  const u = user();
  const [a, b, c] = openMatches();
  const lost = placeBet(u, [{ matchId: a, selection: "2" }, { matchId: b, selection: "X" }], 50);
  const single = placeBet(u, [{ matchId: c, selection: "GG" }], 30);
  settleMatch(a, 3, 0);
  assert.equal(get<any>("SELECT status FROM bets WHERE id = ?", lost.betId).status, "lost");
  cancelMatch(c);
  assert.equal(get<any>("SELECT status FROM bets WHERE id = ?", single.betId).status, "void");
  assert.equal(bal(u), 950);
});

test("validation", () => {
  const u = user();
  const [a] = openMatches();
  assert.throws(() => placeBet(u, [{ matchId: a, selection: "1" }], 5000), /Insufficient/);
  assert.throws(() => placeBet(u, [{ matchId: a, selection: "1" }, { matchId: a, selection: "X" }], 5), /one selection/);
  assert.throws(() => placeBet(u, [{ matchId: a, selection: "Z" }], 5), /Invalid selection/);
  assert.throws(() => placeBet(u, [{ matchId: 1, selection: "1" }], 5), /closed/); // match 1 was settled above
  assert.equal(bal(u), 1000);
});
