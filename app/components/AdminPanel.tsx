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
          <h2>Shto ndeshje</h2>
          <input type="hidden" name="op" value="create" />
          <input type="hidden" name="tz" value={tz} />
          <label>Liga<input name="league" placeholder="p.sh. Kosovë · Superliga" required /></label>
          <div className="row2">
            <label>Vendasit<input name="home" required /></label>
            <label>Vlerësimi<input name="hr" type="number" min={1} max={100} defaultValue={70} /></label>
          </div>
          <div className="row2">
            <label>Mysafirët<input name="away" required /></label>
            <label>Vlerësimi<input name="ar" type="number" min={1} max={100} defaultValue={70} /></label>
          </div>
          <label>Fillimi<input name="kickoff" type="datetime-local" required /></label>
          <p className="muted small">Koeficientët llogariten automatikisht nga vlerësimet (modeli Poisson, marzh 6%).</p>
          <button className="btn btn-accent" disabled={pending}>Shto</button>
        </form>

        <form action={act} className="card form">
          <h2>Xhiro e re</h2>
          <input type="hidden" name="op" value="round" />
          <p className="muted">Gjeneron ndeshje të reja për të gjitha ligat shembull në ditët në vijim.</p>
          <button className="btn btn-ghost" disabled={pending}>Gjenero xhiron</button>
        </form>
      </div>

      <div className="card">
        <h2>Ndeshjet e hapura ({matches.length})</h2>
        <table className="table admin-table">
          <thead><tr><th>Ndeshja</th><th>Baste</th><th>Rezultati</th><th></th></tr></thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id}>
                <td><b>{m.home} – {m.away}</b><div className="muted small">{m.league} · {fmtDateTime(m.kickoff)}</div></td>
                <td>{m.open_bets}</td>
                <td>
                  <form action={act} className="score-form">
                    <input type="hidden" name="op" value="result" /><input type="hidden" name="id" value={m.id} />
                    <input name="hg" type="number" min={0} max={29} required aria-label="Golat vendas" />
                    <span>:</span>
                    <input name="ag" type="number" min={0} max={29} required aria-label="Golat mysafir" />
                    <button className="btn btn-ghost sm" disabled={pending}>Ruaj</button>
                  </form>
                </td>
                <td className="actions">
                  <form action={act}><input type="hidden" name="op" value="simulate" /><input type="hidden" name="id" value={m.id} />
                    <button className="btn btn-ghost sm" disabled={pending}>🎲 Simulo</button></form>
                  <form action={act}><input type="hidden" name="op" value="cancel" /><input type="hidden" name="id" value={m.id} />
                    <button className="btn btn-danger sm" disabled={pending}>Anulo</button></form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
