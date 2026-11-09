"use client";
import { useActionState, useEffect, useState } from "react";
import { adminAction, type FormState } from "../actions";
import { fill, leagueName, type Dict } from "@/lib/i18n";
import { fmtDateTime } from "@/lib/format";

type M = { id: number; league: string; home: string; away: string; kickoff: string; open_bets: number };

export default function AdminPanel({ d, matches }: { d: Dict; matches: M[] }) {
  const a = d.admin;
  const [state, act, pending] = useActionState<FormState, FormData>(adminAction, {});
  const [tz, setTz] = useState(0);
  useEffect(() => setTz(new Date().getTimezoneOffset()), []);
  return (
    <>
      {state.ok && <p className="ok">{state.ok}</p>}
      {state.error && <p className="err">{state.error}</p>}

      <div className="admin-grid">
        <form action={act} className="card form">
          <h2>{a.addMatch}</h2>
          <input type="hidden" name="op" value="create" />
          <input type="hidden" name="tz" value={tz} />
          <label>{a.league}<input name="league" placeholder={a.leaguePh} required /></label>
          <div className="row2">
            <label>{a.home}<input name="home" required /></label>
            <label>{a.rating}<input name="hr" type="number" min={1} max={100} defaultValue={70} /></label>
          </div>
          <div className="row2">
            <label>{a.away}<input name="away" required /></label>
            <label>{a.rating}<input name="ar" type="number" min={1} max={100} defaultValue={70} /></label>
          </div>
          <label>{a.kickoff}<input name="kickoff" type="datetime-local" required /></label>
          <p className="muted small">{a.priceNote}</p>
          <button className="btn btn-accent" disabled={pending}>{a.add}</button>
        </form>

        <form action={act} className="card form">
          <h2>{a.newRound}</h2>
          <input type="hidden" name="op" value="round" />
          <p className="muted">{a.newRoundNote}</p>
          <button className="btn btn-ghost" disabled={pending}>{a.generate}</button>
        </form>
        <form action={act} className="card form">
          <h2>{a.feed}</h2>
          <input type="hidden" name="op" value="sync" />
          <button className="btn btn-accent" disabled={pending}>{a.sync}</button>
        </form>
      </div>

      <div className="card">
        <h2>{fill(a.openMatches, { n: matches.length })}</h2>
        <table className="table admin-table">
          <thead><tr><th>{d.match}</th><th>{d.bets}</th><th>{a.score}</th><th></th></tr></thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id}>
                <td><b>{m.home} – {m.away}</b><div className="muted small">{leagueName(m.league, d)} · {fmtDateTime(m.kickoff, d.days)}</div></td>
                <td>{m.open_bets}</td>
                <td>
                  <form action={act} className="score-form">
                    <input type="hidden" name="op" value="result" /><input type="hidden" name="id" value={m.id} />
                    <input name="hg" type="number" min={0} max={29} required aria-label={a.homeGoals} />
                    <span>:</span>
                    <input name="ag" type="number" min={0} max={29} required aria-label={a.awayGoals} />
                    <button className="btn btn-ghost sm" disabled={pending}>{a.save}</button>
                  </form>
                </td>
                <td className="actions">
                  <form action={act}><input type="hidden" name="op" value="simulate" /><input type="hidden" name="id" value={m.id} />
                    <button className="btn btn-ghost sm" disabled={pending}>🎲 {a.simulate}</button></form>
                  <form action={act}><input type="hidden" name="op" value="cancel" /><input type="hidden" name="id" value={m.id} />
                    <button className="btn btn-danger sm" disabled={pending}>{a.cancel}</button></form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
