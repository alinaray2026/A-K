import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { currentUser } from "@/lib/auth";
import { claimBonus, logout } from "./actions";
import { money } from "@/lib/format";
import { getLang } from "@/lib/lang";
import { DICTS } from "@/lib/i18n";
import LangSwitcher from "./components/LangSwitcher";
import RegisterSW from "./components/RegisterSW";

export const metadata: Metadata = {
  title: "A&K Bet",
  description: "Football betting",
  applicationName: "A&K Bet",
  appleWebApp: { capable: true, title: "A&K Bet", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = { themeColor: "#0f2a44", width: "device-width", initialScale: 1, viewportFit: "cover" };

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, lang] = await Promise.all([currentUser(), getLang()]);
  const d = DICTS[lang];
  const today = new Date().toISOString().slice(0, 10);
  return (
    <html lang={lang}>
      <body>
        <RegisterSW />
        <header className="topbar">
          <div className="wrap topbar-in">
            <Link href="/" className="brand"><span className="brand-ball">⚽</span>A&amp;K <b>Bet</b></Link>
            <div className="account">
              <LangSwitcher current={lang} />
              {user ? (
                <>
                  {user.last_bonus !== today && (
                    <form action={claimBonus}><button className="btn btn-ghost sm" title={d.bonusTitle}>🎁 {d.bonus}</button></form>
                  )}
                  <div className="balance"><small>{user.username}</small><b>{money(user.balance, lang)} {d.pts}</b></div>
                  <form action={logout}><button className="btn btn-ghost sm">{d.auth.logout}</button></form>
                </>
              ) : (
                <>
                  <Link className="btn btn-ghost sm" href="/login">{d.auth.login}</Link>
                  <Link className="btn btn-accent sm" href="/register">{d.auth.signup}</Link>
                </>
              )}
            </div>
          </div>
          <nav className="subnav">
            <div className="wrap subnav-in">
              <Link href="/">{d.nav.football}</Link>
              <Link href="/bets">{d.nav.myBets}</Link>
              <Link href="/leaderboard">{d.nav.leaderboard}</Link>
              {user?.is_admin ? <Link href="/admin">{d.nav.admin}</Link> : null}
            </div>
          </nav>
        </header>
        <main className="wrap">{children}</main>
        <footer className="wrap footer">{d.footer}</footer>
      </body>
    </html>
  );
}
