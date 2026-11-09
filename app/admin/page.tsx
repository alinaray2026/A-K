import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { all } from "@/lib/db";
import AdminPanel from "../components/AdminPanel";

export default async function Admin() {
  const user = await currentUser();
  if (!user?.is_admin) redirect("/");
  const matches = all<{ id: number; league: string; home: string; away: string; kickoff: string; open_bets: number }>(
    `SELECT m.id, m.league, m.home, m.away, m.kickoff,
       (SELECT COUNT(DISTINCT s.bet_id) FROM bet_selections s WHERE s.match_id = m.id) AS open_bets
     FROM matches m WHERE m.status = 'scheduled' ORDER BY m.kickoff`);
  const stats = all<{ k: string; v: number }>(
    `SELECT 'Users' AS k, COUNT(*) AS v FROM users
     UNION ALL SELECT 'Open bets', COUNT(*) FROM bets WHERE status = 'open'
     UNION ALL SELECT 'Total staked', COALESCE(ROUND(SUM(stake), 2), 0) FROM bets
     UNION ALL SELECT 'Paid out', COALESCE(ROUND(SUM(payout), 2), 0) FROM bets`);
  return (
    <>
      <h1 className="page-title">Admin panel</h1>
      <div className="stats">{stats.map((s) => <div key={s.k} className="card stat"><small>{s.k}</small><b>{s.v}</b></div>)}</div>
      <AdminPanel matches={matches} />
    </>
  );
}
