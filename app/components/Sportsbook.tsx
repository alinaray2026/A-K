"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { OpenMatch } from "@/lib/bets";
import { fmtDay, fmtTime, money } from "@/lib/format";
import { submitBet } from "../actions";

const MARKETS = [
  { id: "1X2", label: "1X2", sels: ["1", "X", "2"], heads: ["1", "X", "2"] },
  { id: "OU", label: "Over/Under 2.5", sels: ["O", "U"], heads: ["Over", "Under"] },
  { id: "BTTS", label: "GG/NG", sels: ["GG", "NG"], heads: ["GG", "NG"] },
] as const;

const SEL_NAME: Record<string, string> = { "1": "Home win (1)", X: "Draw (X)", "2": "Away win (2)", O: "Over 2.5 goals", U: "Under 2.5 goals", GG: "Both teams score (GG)", NG: "Not both score (NG)" };

type Pick = { matchId: number; selection: string; price: number; label: string };

export default function Sportsbook({ matches, loggedIn, balance }: { matches: OpenMatch[]; loggedIn: boolean; balance: number }) {
  const leagues = useMemo(() => [...new Set(matches.map((m) => m.league))], [matches]);
  const [league, setLeague] = useState<string>("all");
  const [market, setMarket] = useState<(typeof MARKETS)[number]>(MARKETS[0]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [stake, setStake] = useState("10");
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});
  const [slipOpen, setSlipOpen] = useState(false);
  const [pending, start] = useTransition();

  const shown = league === "all" ? matches : matches.filter((m) => m.league === league);
  const totalOdds = picks.reduce((p, s) => p * s.price, 1);
  const stakeNum = Number(stake) || 0;
  const potential = stakeNum * totalOdds;

  function toggle(m: OpenMatch, sel: string) {
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
          <button className={league === "all" ? "chip on" : "chip"} onClick={() => setLeague("all")}>All</button>
          {leagues.map((l) => (
            <button key={l} className={league === l ? "chip on" : "chip"} onClick={() => setLeague(l)}>{l}</button>
          ))}
        </div>
        <div className="tabs">
          {MARKETS.map((mk) => (
            <button key={mk.id} className={market.id === mk.id ? "tab on" : "tab"} onClick={() => setMarket(mk)}>{mk.label}</button>
          ))}
        </div>

        <div className="card events">
          <div className="ev-head">
            <span>Match</span>
            <div className={`odds cols-${market.sels.length}`}>{market.heads.map((h) => <span key={h}>{h}</span>)}</div>
          </div>
          {shown.length === 0 && <p className="empty">No open matches right now.</p>}
          {shown.map((m) => (
            <div key={m.id} className="ev">
              <div className="ev-info">
                <div className="ev-meta">{fmtDay(m.kickoff)} · {fmtTime(m.kickoff)} · {m.league}</div>
                <div className="ev-team">{m.home}</div>
                <div className="ev-team">{m.away}</div>
              </div>
              <div className={`odds cols-${market.sels.length}`}>
                {market.sels.map((s) => {
                  const on = picks.some((p) => p.matchId === m.id && p.selection === s);
                  return (
                    <button key={s} className={on ? "odd on" : "odd"} onClick={() => toggle(m, s)}>
                      {m.odds[s]?.toFixed(2)}
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
          <span>Bet slip <b className="badge">{picks.length}</b></span>
          {picks.length > 0 && <span>Odds {totalOdds.toFixed(2)}</span>}
        </button>
        <div className="slip-body">
          {picks.length === 0 ? (
            <p className="empty">Tap a price to add it to your bet slip.</p>
          ) : (
            <>
              {picks.map((p) => (
                <div key={p.matchId} className="pick">
                  <div>
                    <div className="pick-sel">{SEL_NAME[p.selection]}</div>
                    <div className="muted small">{p.label}</div>
                  </div>
                  <b>{p.price.toFixed(2)}</b>
                  <button className="x" aria-label="Remove" onClick={() => setPicks(picks.filter((q) => q.matchId !== p.matchId))}>×</button>
                </div>
              ))}
              <div className="slip-row"><span>{picks.length > 1 ? `Accumulator (${picks.length})` : "Single"}</span><b>{totalOdds.toFixed(2)}</b></div>
              <label className="stake">
                <span>Stake</span>
                <input type="number" min={1} step="1" inputMode="decimal" value={stake} onChange={(e) => setStake(e.target.value)} />
              </label>
              <div className="quick">
                {[5, 10, 50, 100].map((v) => <button key={v} onClick={() => setStake(String(v))}>{v}</button>)}
              </div>
              <div className="slip-row"><span>Potential win</span><b className="win">{money(potential)}</b></div>
              {loggedIn ? (
                <button className="btn btn-accent block" disabled={pending || stakeNum <= 0 || stakeNum > balance} onClick={place}>
                  {pending ? "Placing…" : stakeNum > balance ? "Insufficient balance" : "Place bet"}
                </button>
              ) : (
                <Link className="btn btn-accent block" href="/login">Log in to play</Link>
              )}
              <button className="link" onClick={() => setPicks([])}>Clear slip</button>
            </>
          )}
          {msg.ok && <p className="ok">{msg.ok}</p>}
          {msg.error && <p className="err">{msg.error}</p>}
        </div>
      </aside>
    </div>
  );
}
