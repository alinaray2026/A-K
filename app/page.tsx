import { leagueName } from "@/lib/i18n";
import { currentUser } from "@/lib/auth";
import { listOpenMatches } from "@/lib/bets";
import { all } from "@/lib/db";
import { getDict } from "@/lib/lang";
import Sportsbook from "./components/Sportsbook";
import { fmtDateTime } from "@/lib/format";

export default async function Home() {
  const [user, d] = await Promise.all([currentUser(), getDict()]);
  const matches = listOpenMatches();
  const results = all<{ id: number; league: string; home: string; away: string; home_goals: number; away_goals: number; kickoff: string; status: string }>(
    "SELECT * FROM matches WHERE status <> 'scheduled' ORDER BY id DESC LIMIT 8");
  return (
    <>
      <Sportsbook d={d} matches={matches} loggedIn={!!user} balance={user?.balance ?? 0} />
      {results.length > 0 && (
        <section className="card results">
          <h2>{d.latestResults}</h2>
          {results.map((r) => (
            <div key={r.id} className="result-row">
              <span className="muted">{leagueName(r.league, d)} · {fmtDateTime(r.kickoff, d.days)}</span>
              <span>{r.home} <b>{r.status === "cancelled" ? d.cancelled : `${r.home_goals} – ${r.away_goals}`}</b> {r.away}</span>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
