// Client for The Odds API (https://the-odds-api.com). Key comes from ODDS_API_KEY.
const BASE = "https://api.the-odds-api.com/v4";

/** API sport key → league label shown in the app ("Country · League"). */
export const SPORTS: Record<string, string> = {
  soccer_italy_serie_a: "Italy · Serie A",
  soccer_germany_bundesliga: "Germany · Bundesliga",
  soccer_epl: "England · Premier League",
  soccer_spain_la_liga: "Spain · La Liga",
  soccer_uefa_champs_league: "Europe · Champions League",
};
export const DEFAULT_SPORTS = ["soccer_italy_serie_a", "soccer_germany_bundesliga", "soccer_epl", "soccer_spain_la_liga"];

export function apiKey() {
  return process.env.ODDS_API_KEY || "";
}
export function enabledSports() {
  const list = (process.env.ODDS_SPORTS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return (list.length ? list : DEFAULT_SPORTS).filter((s) => SPORTS[s]);
}

type Outcome = { name: string; price: number; point?: number };
export type ApiEvent = {
  id: string; commence_time: string; home_team: string; away_team: string;
  bookmakers: { key: string; markets: { key: string; outcomes: Outcome[] }[] }[];
};
export type ApiScore = {
  id: string; completed: boolean; home_team: string; away_team: string;
  scores: { name: string; score: string }[] | null;
};

let remaining: number | null = null;
/** Credits left this month, as reported by the last response. */
export const creditsRemaining = () => remaining;

async function call<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams({ ...params, apiKey: apiKey() });
  const res = await fetch(`${BASE}${path}?${qs}`, { cache: "no-store", signal: AbortSignal.timeout(15000) });
  const left = res.headers.get("x-requests-remaining");
  if (left !== null) remaining = Number(left);
  if (!res.ok) throw new Error(`Odds API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json() as Promise<T>;
}

/** Costs 2 credits per sport (h2h + totals, one region). */
export function fetchOdds(sport: string) {
  return call<ApiEvent[]>(`/sports/${sport}/odds`, { regions: "eu", markets: "h2h,totals", oddsFormat: "decimal", dateFormat: "iso" });
}
/** Costs 2 credits per sport (daysFrom makes it include finished games). */
export function fetchScores(sport: string) {
  return call<ApiScore[]>(`/sports/${sport}/scores`, { daysFrom: "3", dateFormat: "iso" });
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Market consensus: median price across bookmakers for each of our selections. */
export function consensusOdds(e: ApiEvent) {
  const buckets: Record<string, number[]> = { "1": [], X: [], "2": [], O: [], U: [] };
  for (const b of e.bookmakers) for (const m of b.markets) for (const o of m.outcomes) {
    if (m.key === "h2h") {
      const sel = o.name === e.home_team ? "1" : o.name === e.away_team ? "2" : o.name === "Draw" ? "X" : null;
      if (sel) buckets[sel].push(o.price);
    } else if (m.key === "totals" && o.point === 2.5) {
      if (o.name === "Over") buckets.O.push(o.price);
      if (o.name === "Under") buckets.U.push(o.price);
    }
  }
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(buckets)) if (v.length) out[k] = Math.max(1.01, Math.round(median(v) * 100) / 100);
  return out;
}
