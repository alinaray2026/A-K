import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { getDict } from "@/lib/lang";
import { fmtDateTime, money, price } from "@/lib/format";
import type { Selection } from "@/lib/odds";

type Status = "open" | "won" | "lost" | "void";

export default async function Bets() {
  const [user, d] = await Promise.all([currentUser(), getDict()]);
  if (!user) redirect("/login");
  const L = d.locale;
  const bets = all<{ id: number; stake: number; total_odds: number; potential_win: number; payout: number; status: Status; created_at: string }>(
    "SELECT * FROM bets WHERE user_id = ? ORDER BY id DESC LIMIT 100", user.id);
  const sels = all<{ bet_id: number; selection: Selection; price: number; result: string; home: string; away: string; home_goals: number | null; away_goals: number | null; kickoff: string }>(
    `SELECT s.bet_id, s.selection, s.price, s.result, m.home, m.away, m.home_goals, m.away_goals, m.kickoff
     FROM bet_selections s JOIN matches m ON m.id = s.match_id JOIN bets b ON b.id = s.bet_id
     WHERE b.user_id = ? ORDER BY s.id`, user.id);
  return (
    <>
      <h1 className="page-title">{d.nav.myBets}</h1>
      {bets.length === 0 && <p className="card empty">{d.noBets}</p>}
      <div className="bets">
        {bets.map((b) => (
          <article key={b.id} className={`card bet ${b.status}`}>
            <header>
              <span>#{b.id} · {fmtDateTime(b.created_at.replace(" ", "T") + "Z", d.days)}</span>
              <span className={`tag ${b.status}`}>{d.status[b.status]}</span>
            </header>
            {sels.filter((s) => s.bet_id === b.id).map((s, i) => (
              <div key={i} className="bet-sel">
                <span className={`dot ${s.result}`} />
                <div className="grow">
                  <div>{s.home} – {s.away} {s.home_goals !== null && <b>({s.home_goals}–{s.away_goals})</b>}</div>
                  <div className="muted small">{d.selShort[s.selection]} · {fmtDateTime(s.kickoff, d.days)}</div>
                </div>
                <b>{price(s.price, L)}</b>
              </div>
            ))}
            <footer>
              <span>{d.stake} <b>{money(b.stake, L)}</b></span>
              <span>{d.odds} <b>{price(b.total_odds, L)}</b></span>
              <span>{b.status === "open" ? d.potentialWin : d.payout} <b>{money(b.status === "open" ? b.potential_win : b.payout, L)}</b></span>
            </footer>
          </article>
        ))}
      </div>
    </>
  );
}
