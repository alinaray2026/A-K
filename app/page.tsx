import { currentUser } from "@/lib/auth";
import { listOpenMatches } from "@/lib/bets";
import { all } from "@/lib/db";
import Sportsbook from "./components/Sportsbook";
import { fmtDateTime } from "@/lib/format";

export default async function Home() {
  const user = await currentUser();
  const matches = listOpenMatches();
  const results = all<{ id: number; league: string; home: string; away: string; home_goals: number; away_goals: number; kickoff: string; status: string }>(
    "SELECT * FROM matches WHERE status <> 'scheduled' ORDER BY id DESC LIMIT 8");
  return (
    <>
      <Sportsbook matches={matches} loggedIn={!!user} balance={user?.balance ?? 0} />
      {results.length > 0 && (
        <section className="card results">
          <h2>Latest results</h2>
          {results.map((r) => (
            <div key={r.id} className="result-row">
              <span className="muted">{r.league} · {fmtDateTime(r.kickoff)}</span>
              <span>{r.home} <b>{r.status === "cancelled" ? "cancelled" : `${r.home_goals} – ${r.away_goals}`}</b> {r.away}</span>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
