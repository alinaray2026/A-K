import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { currentUser } from "@/lib/auth";
import { claimBonus, logout } from "./actions";
import { money } from "@/lib/format";

export const metadata: Metadata = {
  title: "GolBet — Baste futbolli (demo)",
  description: "Platformë demo për baste futbolli me pikë virtuale",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const today = new Date().toISOString().slice(0, 10);
  return (
    <html lang="sq">
      <body>
        <header className="topbar">
          <div className="wrap topbar-in">
            <Link href="/" className="brand"><span className="brand-ball">⚽</span>Gol<b>Bet</b></Link>
            <div className="account">
              {user ? (
                <>
                  {user.last_bonus !== today && (
                    <form action={claimBonus}><button className="btn btn-ghost sm" title="+100 pikë çdo ditë">🎁 Bonus</button></form>
                  )}
                  <div className="balance"><small>{user.username}</small><b>{money(user.balance)} pikë</b></div>
                  <form action={logout}><button className="btn btn-ghost sm">Dil</button></form>
                </>
              ) : (
                <>
                  <Link className="btn btn-ghost sm" href="/login">Hyr</Link>
                  <Link className="btn btn-accent sm" href="/register">Regjistrohu</Link>
                </>
              )}
            </div>
          </div>
          <nav className="subnav">
            <div className="wrap subnav-in">
              <Link href="/">Futboll</Link>
              <Link href="/bets">Bastet e mia</Link>
              <Link href="/leaderboard">Renditja</Link>
              {user?.is_admin ? <Link href="/admin">Admin</Link> : null}
            </div>
          </nav>
        </header>
        <main className="wrap">{children}</main>
        <footer className="wrap footer">
          Demo me pikë virtuale — pa para reale, pa pagesa dhe pa fitime në para. 18+. Luaj me përgjegjësi.
        </footer>
      </body>
    </html>
  );
}
