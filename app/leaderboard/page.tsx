import { all } from "@/lib/db";
import { money } from "@/lib/format";

export default function Leaderboard() {
  const rows = all<{ username: string; balance: number; bets: number; won: number }>(
    `SELECT u.username, u.balance, COUNT(b.id) AS bets, COALESCE(SUM(b.status = 'won'), 0) AS won
     FROM users u LEFT JOIN bets b ON b.user_id = u.id
     GROUP BY u.id ORDER BY u.balance DESC LIMIT 50`);
  return (
    <>
      <h1 className="page-title">Leaderboard</h1>
      <div className="card">
        <table className="table">
          <thead><tr><th>#</th><th>Player</th><th>Bets</th><th>Won</th><th className="r">Points</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.username}><td>{i + 1}</td><td>{r.username}</td><td>{r.bets}</td><td>{r.won}</td><td className="r"><b>{money(r.balance)}</b></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
