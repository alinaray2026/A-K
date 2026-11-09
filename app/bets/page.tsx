import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { fmtDateTime, money } from "@/lib/format";
import { SELECTION_LABEL, type Selection } from "@/lib/odds";

const STATUS: Record<string, string> = { open: "Në pritje", won: "Fituar", lost: "Humbur", void: "Kthyer", pending: "Në pritje" };

export default async function Bets() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const bets = all<{ id: number; stake: number; total_odds: number; potential_win: number; payout: number; status: string; created_at: string }>(
    "SELECT * FROM bets WHERE user_id = ? ORDER BY id DESC LIMIT 100", user.id);
  const sels = all<{ bet_id: number; selection: Selection; price: number; result: string; home: string; away: string; home_goals: number | null; away_goals: number | null; kickoff: string }>(
    `SELECT s.bet_id, s.selection, s.price, s.result, m.home, m.away, m.home_goals, m.away_goals, m.kickoff
     FROM bet_selections s JOIN matches m ON m.id = s.match_id JOIN bets b ON b.id = s.bet_id
     WHERE b.user_id = ? ORDER BY s.id`, user.id);
  return (
    <>
      <h1 className="page-title">Bastet e mia</h1>
      {bets.length === 0 && <p className="card empty">Nuk keni vendosur ende asnjë bast.</p>}
      <div className="bets">
        {bets.map((b) => (
          <article key={b.id} className={`card bet ${b.status}`}>
            <header>
              <span>#{b.id} · {fmtDateTime(b.created_at.replace(" ", "T") + "Z")}</span>
              <span className={`tag ${b.status}`}>{STATUS[b.status]}</span>
            </header>
            {sels.filter((s) => s.bet_id === b.id).map((s, i) => (
              <div key={i} className="bet-sel">
                <span className={`dot ${s.result}`} />
                <div className="grow">
                  <div>{s.home} – {s.away} {s.home_goals !== null && <b>({s.home_goals}–{s.away_goals})</b>}</div>
                  <div className="muted small">{SELECTION_LABEL[s.selection]} · {fmtDateTime(s.kickoff)}</div>
                </div>
                <b>{s.price.toFixed(2)}</b>
              </div>
            ))}
            <footer>
              <span>Shuma <b>{money(b.stake)}</b></span>
              <span>Koef. <b>{b.total_odds.toFixed(2)}</b></span>
              <span>{b.status === "open" ? "Fitim i mundshëm" : "Pagesa"} <b>{money(b.status === "open" ? b.potential_win : b.payout)}</b></span>
            </footer>
          </article>
        ))}
      </div>
    </>
  );
}
