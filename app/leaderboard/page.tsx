import { all } from "@/lib/db";
import { money } from "@/lib/format";
import { getDict } from "@/lib/lang";

export default async function Leaderboard() {
  const d = await getDict();
  const rows = all<{ username: string; balance: number; bets: number; won: number }>(
    `SELECT u.username, u.balance, COUNT(b.id) AS bets, COALESCE(SUM(b.status = 'won'), 0) AS won
     FROM users u LEFT JOIN bets b ON b.user_id = u.id
     GROUP BY u.id ORDER BY u.balance DESC LIMIT 50`);
  return (
    <>
      <h1 className="page-title">{d.nav.leaderboard}</h1>
      <div className="card">
        <table className="table">
          <thead><tr><th>#</th><th>{d.player}</th><th>{d.bets}</th><th>{d.won}</th><th className="r">{d.points}</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.username}><td>{i + 1}</td><td>{r.username}</td><td>{r.bets}</td><td>{r.won}</td><td className="r"><b>{money(r.balance, d.locale)}</b></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
