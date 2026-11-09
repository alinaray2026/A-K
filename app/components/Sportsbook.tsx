"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { OpenMatch } from "@/lib/bets";
import { fill, leagueName, type Dict } from "@/lib/i18n";
import { fmtDay, fmtTime, money, price } from "@/lib/format";
import { submitBet } from "../actions";

type Sel = keyof Dict["sel"];
type Pick = { matchId: number; selection: Sel; price: number; label: string };

export default function Sportsbook({ d, matches, loggedIn, balance }: { d: Dict; matches: OpenMatch[]; loggedIn: boolean; balance: number }) {
  const MARKETS = [
    { id: "1X2", label: d.markets.m1x2, sels: ["1", "X", "2"] as Sel[], heads: ["1", "X", "2"] },
    { id: "OU", label: d.markets.ou, sels: ["O", "U"] as Sel[], heads: d.markets.ouHeads },
    { id: "BTTS", label: d.markets.btts, sels: ["GG", "NG"] as Sel[], heads: [d.selShort.GG, d.selShort.NG] },
  ].filter((mk) => mk.id === "1X2" || matches.some((m) => mk.sels.some((s) => m.odds[s]))); // hide markets the feed doesn't price
  const L = d.locale;
  const leagues = useMemo(() => [...new Set(matches.map((m) => m.league))], [matches]);
  const [league, setLeague] = useState<string>("all");
  const [marketId, setMarketId] = useState("1X2");
  const market = MARKETS.find((m) => m.id === marketId) ?? MARKETS[0];
  const [picks, setPicks] = useState<Pick[]>([]);
  const [stake, setStake] = useState("10");
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [slipOpen, setSlipOpen] = useState(false);
  const [pending, start] = useTransition();

  const shown = league === "all" ? matches : matches.filter((m) => m.league === league);
  const totalOdds = picks.reduce((p, s) => p * s.price, 1);
  const stakeNum = Number(stake.replace(",", ".")) || 0;

  function toggle(m: OpenMatch, sel: Sel) {
    setMsg({});
    setPicks((cur) => {
      const same = cur.find((p) => p.matchId === m.id && p.selection === sel);
      const rest = cur.filter((p) => p.matchId !== m.id);
      if (same) return rest;
      return [...rest, { matchId: m.id, selection: sel, price: m.odds[sel], label: `${m.home} – ${m.away}` }];
    });
  }

  function place() {
    start(async () => {
      const r = await submitBet(picks.map(({ matchId, selection }) => ({ matchId, selection })), stakeNum);
      setMsg(r);
      if (r.ok) setPicks([]);
    });
  }

  return (
    <div className="book">
      <section>
        <div className="chips">
          <button className={league === "all" ? "chip on" : "chip"} onClick={() => setLeague("all")}>{d.all}</button>
          {leagues.map((l) => (
            <button key={l} className={league === l ? "chip on" : "chip"} onClick={() => setLeague(l)}>{leagueName(l, d)}</button>
          ))}
        </div>
        <div className="tabs">
          {MARKETS.map((mk) => (
            <button key={mk.id} className={market.id === mk.id ? "tab on" : "tab"} onClick={() => setMarketId(mk.id)}>{mk.label}</button>
          ))}
        </div>

        <div className="card events">
          <div className="ev-head">
            <span>{d.match}</span>
            <div className={`odds cols-${market.sels.length}`}>{market.heads.map((h) => <span key={h}>{h}</span>)}</div>
          </div>
          {shown.length === 0 && <p className="empty">{d.noOpen}</p>}
          {shown.map((m) => (
            <div key={m.id} className="ev">
              <div className="ev-info">
                <div className="ev-meta">{fmtDay(m.kickoff, d.days)} · {fmtTime(m.kickoff)} · {leagueName(m.league, d)}</div>
                <div className="ev-team">{m.home}</div>
                <div className="ev-team">{m.away}</div>
              </div>
              <div className={`odds cols-${market.sels.length}`}>
                {market.sels.map((s) => {
                  const on = picks.some((p) => p.matchId === m.id && p.selection === s);
                  if (!m.odds[s]) return <button key={s} className="odd" disabled aria-label={`${m.home} – ${m.away}: ${d.sel[s]}`}>–</button>;
                  return (
                    <button key={s} className={on ? "odd on" : "odd"} aria-pressed={on} onClick={() => toggle(m, s)}
                      aria-label={`${m.home} – ${m.away}: ${d.sel[s]} ${price(m.odds[s], L)}`}>
                      {m.odds[s] ? price(m.odds[s], L) : "–"}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className={slipOpen ? "slip open" : "slip"}>
        <button className="slip-head" onClick={() => setSlipOpen(!slipOpen)}>
          <span>{d.betSlip} <b className="badge">{picks.length}</b></span>
          {picks.length > 0 && <span>{d.odds} {price(totalOdds, L)}</span>}
        </button>
        <div className="slip-body">
          {picks.length === 0 ? (
            <p className="empty">{d.tapPrice}</p>
          ) : (
            <>
              {picks.map((p) => (
                <div key={p.matchId} className="pick">
                  <div>
                    <div className="pick-sel">{d.sel[p.selection]}</div>
                    <div className="muted small">{p.label}</div>
                  </div>
                  <b>{price(p.price, L)}</b>
                  <button className="x" aria-label={d.remove} onClick={() => setPicks(picks.filter((q) => q.matchId !== p.matchId))}>×</button>
                </div>
              ))}
              <div className="slip-row"><span>{picks.length > 1 ? fill(d.accumulator, { n: picks.length }) : d.single}</span><b>{price(totalOdds, L)}</b></div>
              <label className="stake">
                <span>{d.stake}</span>
                <input type="number" min={1} step="1" inputMode="decimal" value={stake} onChange={(e) => setStake(e.target.value)} />
              </label>
              <div className="quick">
                {[5, 10, 50, 100].map((v) => <button key={v} onClick={() => setStake(String(v))}>{v}</button>)}
              </div>
              <div className="slip-row"><span>{d.potentialWin}</span><b className="win">{money(stakeNum * totalOdds, L)}</b></div>
              {loggedIn ? (
                <button className="btn btn-accent block" disabled={pending || stakeNum < 1 || stakeNum > balance} onClick={place}>
                  {pending ? d.placing : stakeNum > balance ? d.insufficient : d.placeBet}
                </button>
              ) : (
                <Link className="btn btn-accent block" href="/login">{d.loginToPlay}</Link>
              )}
              <button className="link" onClick={() => setPicks([])}>{d.clearSlip}</button>
            </>
          )}
          {msg.ok && <p className="ok">{msg.ok}</p>}
          {msg.error && <p className="err">{msg.error}</p>}
        </div>
      </aside>
    </div>
  );
}
