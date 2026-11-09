process.env.DB_FILE = ":memory:";
process.env.ODDS_API_KEY = "test-key";
import { test } from "node:test";
import assert from "node:assert/strict";
import { get, run } from "../lib/db.ts";
import { placeBet } from "../lib/bets.ts";
import { consensusOdds, type ApiEvent } from "../lib/oddsapi.ts";
import { syncOdds, syncScores } from "../lib/sync.ts";

const future = new Date(Date.now() + 86400e3).toISOString();
const event = (id: string, home: string, away: string, prices: [number, number, number][], kickoff = future): ApiEvent => ({
  id, commence_time: kickoff, home_team: home, away_team: away,
  bookmakers: prices.map(([h, d, a], i) => ({ key: "bm" + i, markets: [
    { key: "h2h", outcomes: [{ name: home, price: h }, { name: "Draw", price: d }, { name: away, price: a }] },
    { key: "totals", outcomes: [{ name: "Over", price: 1.9, point: 2.5 }, { name: "Under", price: 1.95, point: 2.5 }] },
  ] })),
});

function mockFetch(handler: (url: URL) => unknown) {
  globalThis.fetch = (async (input: string | URL) => {
    const url = new URL(String(input));
    return new Response(JSON.stringify(handler(url)), { headers: { "x-requests-remaining": "480" } });
  }) as typeof fetch;
}

test("consensus price is the median across bookmakers", () => {
  const o = consensusOdds(event("e", "Inter", "Milan", [[2.0, 3.4, 3.9], [2.1, 3.3, 4.0], [1.9, 3.5, 3.8]]));
  assert.deepEqual(o, { "1": 2.0, X: 3.4, "2": 3.9, O: 1.9, U: 1.95 });
});

test("sync imports matches, then settles bets from real scores", async () => {
  mockFetch((url) => url.pathname.includes("/soccer_italy_serie_a/") ? [event("ev1", "Inter", "Milan", [[2.0, 3.4, 3.9]])] : []);
  const r = await syncOdds();
  assert.equal(r.matches, 1);
  const m = get<{ id: number }>("SELECT id FROM matches WHERE external_id = 'ev1'")!;
  assert.equal(get<{ price: number }>("SELECT price FROM odds WHERE match_id = ? AND selection = '1'", m.id)!.price, 2.0);

  const u = Number(run("INSERT INTO users (username, password_hash) VALUES ('fan', 'x')").lastInsertRowid);
  const bet = placeBet(u, [{ matchId: m.id, selection: "1" }], 100);

  // the match is played: move kick-off into the past and let the API report 2–1
  run("UPDATE matches SET kickoff = ? WHERE id = ?", new Date(Date.now() - 3 * 3600e3).toISOString(), m.id);
  mockFetch(() => [{ id: "ev1", completed: true, home_team: "Inter", away_team: "Milan", scores: [{ name: "Inter", score: "2" }, { name: "Milan", score: "1" }] }]);
  const s = await syncScores();
  assert.equal(s.settled, 1);
  assert.equal(get<{ status: string }>("SELECT status FROM bets WHERE id = ?", bet.betId)!.status, "won");
  assert.equal(get<{ balance: number }>("SELECT balance FROM users WHERE id = ?", u)!.balance, 1100);
});
