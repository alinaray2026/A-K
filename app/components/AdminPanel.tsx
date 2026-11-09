"use client";
import { useActionState, useEffect, useState } from "react";
import { adminAction, type FormState } from "../actions";
import { fmtDateTime } from "@/lib/format";

type M = { id: number; league: string; home: string; away: string; kickoff: string; open_bets: number };

export default function AdminPanel({ matches }: { matches: M[] }) {
  const [state, act, pending] = useActionState<FormState, FormData>(adminAction, {});
  const [tz, setTz] = useState(0);
  useEffect(() => setTz(new Date().getTimezoneOffset()), []);
  return (
    <>
      {state.ok && <p className="ok">{state.ok}</p>}
      {state.error && <p className="err">{state.error}</p>}

      <div className="admin-grid">
        <form action={act} className="card form">
          <h2>Add match</h2>
          <input type="hidden" name="op" value="create" />
          <input type="hidden" name="tz" value={tz} />
          <label>League<input name="league" placeholder="e.g. Kosovo · Superliga" required /></label>
          <div className="row2">
            <label>Home team<input name="home" required /></label>
            <label>Rating<input name="hr" type="number" min={1} max={100} defaultValue={70} /></label>
          </div>
          <div className="row2">
            <label>Away team<input name="away" required /></label>
            <label>Rating<input name="ar" type="number" min={1} max={100} defaultValue={70} /></label>
          </div>
          <label>Kick-off<input name="kickoff" type="datetime-local" required /></label>
          <p className="muted small">Prices are calculated automatically from the ratings (Poisson model, 6% margin).</p>
          <button className="btn btn-accent" disabled={pending}>Add</button>
        </form>

        <form action={act} className="card form">
          <h2>New round</h2>
          <input type="hidden" name="op" value="round" />
          <p className="muted">Creates new matches for all sample leagues over the next few days.</p>
          <button className="btn btn-ghost" disabled={pending}>Generate round</button>
        </form>
      </div>

      <div className="card">
        <h2>Open matches ({matches.length})</h2>
        <table className="table admin-table">
          <thead><tr><th>Match</th><th>Bets</th><th>Score</th><th></th></tr></thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id}>
                <td><b>{m.home} – {m.away}</b><div className="muted small">{m.league} · {fmtDateTime(m.kickoff)}</div></td>
                <td>{m.open_bets}</td>
                <td>
                  <form action={act} className="score-form">
                    <input type="hidden" name="op" value="result" /><input type="hidden" name="id" value={m.id} />
                    <input name="hg" type="number" min={0} max={29} required aria-label="Home goals" />
                    <span>:</span>
                    <input name="ag" type="number" min={0} max={29} required aria-label="Away goals" />
                    <button className="btn btn-ghost sm" disabled={pending}>Save</button>
                  </form>
                </td>
                <td className="actions">
                  <form action={act}><input type="hidden" name="op" value="simulate" /><input type="hidden" name="id" value={m.id} />
                    <button className="btn btn-ghost sm" disabled={pending}>🎲 Simulate</button></form>
                  <form action={act}><input type="hidden" name="op" value="cancel" /><input type="hidden" name="id" value={m.id} />
                    <button className="btn btn-danger sm" disabled={pending}>Cancel</button></form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
