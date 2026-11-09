import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { currentUser } from "@/lib/auth";
import { claimBonus, logout } from "./actions";
import { money } from "@/lib/format";

export const metadata: Metadata = {
  title: "A&K Bet — Football betting (demo)",
  description: "Football betting demo with virtual points",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const today = new Date().toISOString().slice(0, 10);
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="wrap topbar-in">
            <Link href="/" className="brand"><span className="brand-ball">⚽</span>A&amp;K <b>Bet</b></Link>
            <div className="account">
              {user ? (
                <>
                  {user.last_bonus !== today && (
                    <form action={claimBonus}><button className="btn btn-ghost sm" title="+100 points every day">🎁 Bonus</button></form>
                  )}
                  <div className="balance"><small>{user.username}</small><b>{money(user.balance)} pts</b></div>
                  <form action={logout}><button className="btn btn-ghost sm">Log out</button></form>
                </>
              ) : (
                <>
                  <Link className="btn btn-ghost sm" href="/login">Log in</Link>
                  <Link className="btn btn-accent sm" href="/register">Sign up</Link>
                </>
              )}
            </div>
          </div>
          <nav className="subnav">
            <div className="wrap subnav-in">
              <Link href="/">Football</Link>
              <Link href="/bets">My bets</Link>
              <Link href="/leaderboard">Leaderboard</Link>
              {user?.is_admin ? <Link href="/admin">Admin</Link> : null}
            </div>
          </nav>
        </header>
        <main className="wrap">{children}</main>
        <footer className="wrap footer">
          Demo with virtual points: no real money, no payments, no cash prizes. 18+. Play responsibly.
        </footer>
      </body>
    </html>
  );
}
