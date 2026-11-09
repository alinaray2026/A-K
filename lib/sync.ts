// Keeps matches, odds and results in step with The Odds API.
// Runs lazily from page requests (no cron needed) and from the admin "Sync now" button.
import { all, get, run, tx } from "./db.ts";
import { apiKey, consensusOdds, enabledSports, fetchOdds, fetchScores, SPORTS } from "./oddsapi.ts";
import { settleMatch } from "./settle.ts";

const HOURS = (name: string, def: number) => Number(process.env[name] ?? def) * 3600_000;
const ODDS_EVERY = () => HOURS("ODDS_SYNC_HOURS", 24);
const SCORES_EVERY = () => HOURS("SCORES_SYNC_HOURS", 12);
const FINISH_AFTER = 2 * 3600_000; // look for a result 2h after kick-off

const getMeta = (k: string) => get<{ v: string }>("SELECT v FROM meta WHERE k = ?", k)?.v;
const setMeta = (k: string, v: string) => run("INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v", k, v);
const stale = (k: string, every: number) => Date.now() - Number(getMeta(k) ?? 0) > every;

export type SyncReport = { matches: number; settled: number; errors: string[] };

export async function syncOdds(): Promise<SyncReport> {
  const rep: SyncReport = { matches: 0, settled: 0, errors: [] };
  for (const sport of enabledSports()) {
    try {
      const events = await fetchOdds(sport);
      tx(() => {
        for (const e of events) {
          const odds = consensusOdds(e);
          if (!odds["1"] || !odds.X || !odds["2"]) continue;
          const existing = get<{ id: number; status: string }>("SELECT id, status FROM matches WHERE external_id = ?", e.id);
          let id: number;
          if (!existing) {
            id = Number(run(`INSERT INTO matches (league, home, away, kickoff, home_xg, away_xg, external_id, source)
              VALUES (?, ?, ?, ?, 1.4, 1.15, ?, ?)`, SPORTS[sport], e.home_team, e.away_team, e.commence_time, e.id, sport).lastInsertRowid);
          } else {
            if (existing.status !== "scheduled") continue;
            id = existing.id;
            run("UPDATE matches SET kickoff = ? WHERE id = ?", e.commence_time, id);
            run("DELETE FROM odds WHERE match_id = ?", id); // placed bets keep the price they were struck at
          }
          for (const [sel, p] of Object.entries(odds)) run("INSERT INTO odds (match_id, selection, price) VALUES (?, ?, ?)", id, sel, p);
          rep.matches++;
        }
      });
    } catch (err) {
      rep.errors.push(`${sport}: ${(err as Error).message}`);
    }
  }
  // only count it as done if at least one league came through, so a failed run is retried on the next request
  if (rep.errors.length < enabledSports().length) setMeta("odds_synced_at", String(Date.now()));
  if (rep.errors.length) console.error("odds sync:", rep.errors.join("; "));
  return rep;
}

export async function syncScores(force = false): Promise<SyncReport> {
  const rep: SyncReport = { matches: 0, settled: 0, errors: [] };
  const cutoff = new Date(Date.now() - FINISH_AFTER).toISOString();
  // only spend credits on leagues that have a match waiting for its result
  const sports = all<{ source: string }>(
    "SELECT DISTINCT source FROM matches WHERE status = 'scheduled' AND external_id IS NOT NULL AND kickoff < ?", cutoff)
    .map((r) => r.source).filter((s) => SPORTS[s]);
  for (const sport of sports) {
    try {
      for (const s of await fetchScores(sport)) {
        if (!s.completed || !s.scores) continue;
        const m = get<{ id: number; status: string }>("SELECT id, status FROM matches WHERE external_id = ?", s.id);
        if (!m || m.status !== "scheduled") continue;
        const goals = (team: string) => Number(s.scores!.find((x) => x.name === team)?.score);
        const hg = goals(s.home_team), ag = goals(s.away_team);
        if (!Number.isInteger(hg) || !Number.isInteger(ag)) continue;
        rep.settled += settleMatch(m.id, hg, ag);
        rep.matches++;
      }
    } catch (err) {
      rep.errors.push(`${sport}: ${(err as Error).message}`);
    }
  }
  if ((sports.length || force) && rep.errors.length < Math.max(1, sports.length)) setMeta("scores_synced_at", String(Date.now()));
  if (rep.errors.length) console.error("scores sync:", rep.errors.join("; "));
  return rep;
}

const g = globalThis as unknown as { __syncing?: Promise<void> };

/** Called on page loads: syncs whatever is due. Waits only when there is nothing to show yet. */
export async function maybeSync() {
  if (!apiKey()) return;
  if (g.__syncing) return;
  const oddsDue = stale("odds_synced_at", ODDS_EVERY());
  const scoresDue = stale("scores_synced_at", SCORES_EVERY());
  if (!oddsDue && !scoresDue) return;
  const job = (async () => {
    try {
      if (scoresDue) await syncScores();
      if (oddsDue) await syncOdds();
    } catch (e) {
      console.error("sync failed", e);
    } finally {
      g.__syncing = undefined;
    }
  })();
  g.__syncing = job;
  const hasLive = get<{ n: number }>("SELECT COUNT(*) AS n FROM matches WHERE external_id IS NOT NULL AND status = 'scheduled'")!.n > 0;
  if (!hasLive) await job;
}

export function lastSync() {
  return { odds: Number(getMeta("odds_synced_at") ?? 0), scores: Number(getMeta("scores_synced_at") ?? 0) };
}
