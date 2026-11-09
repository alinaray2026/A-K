import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { getDict } from "@/lib/lang";
import { fmtDateTime, money } from "@/lib/format";
import { fill } from "@/lib/i18n";
import { apiKey, creditsRemaining } from "@/lib/oddsapi";
import { lastSync } from "@/lib/sync";
import AdminPanel from "../components/AdminPanel";

export default async function Admin() {
  const [user, d] = await Promise.all([currentUser(), getDict()]);
  if (!user?.is_admin) redirect("/");
  const matches = all<{ id: number; league: string; home: string; away: string; kickoff: string; open_bets: number }>(
    `SELECT m.id, m.league, m.home, m.away, m.kickoff,
       (SELECT COUNT(DISTINCT s.bet_id) FROM bet_selections s WHERE s.match_id = m.id) AS open_bets
     FROM matches m WHERE m.status = 'scheduled' ORDER BY m.kickoff`);
  const s = get<{ users: number; open: number; staked: number; paid: number }>(
    `SELECT (SELECT COUNT(*) FROM users) AS users,
            (SELECT COUNT(*) FROM bets WHERE status = 'open') AS open,
            (SELECT COALESCE(SUM(stake), 0) FROM bets) AS staked,
            (SELECT COALESCE(SUM(payout), 0) FROM bets) AS paid`)!;
  const stats: [string, string | number][] = [
    [d.admin.users, s.users], [d.admin.openBets, s.open],
    [d.admin.staked, money(s.staked, d.locale)], [d.admin.paid, money(s.paid, d.locale)],
  ];
  return (
    <>
      <h1 className="page-title">{d.admin.title}</h1>
      <div className="stats">{stats.map(([k, v]) => <div key={k} className="card stat"><small>{k}</small><b>{v}</b></div>)}</div>
      <FeedStatus />
      <AdminPanel d={d} matches={matches} />
    </>
  );
}

async function FeedStatus() {
  const d = await getDict();
  if (!apiKey()) return <p className="card muted">{d.admin.noFeed}</p>;
  const ls = lastSync();
  const when = (t: number) => (t ? fmtDateTime(new Date(t).toISOString(), d.days) : d.admin.never);
  return (
    <p className="card feed"><b>● {d.admin.feed}</b> {fill(d.admin.feedNote, { odds: when(ls.odds), scores: when(ls.scores), credits: creditsRemaining() ?? "?" })}</p>
  );
}
