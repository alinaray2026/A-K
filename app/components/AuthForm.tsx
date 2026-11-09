"use client";
import { useActionState } from "react";
import Link from "next/link";
import type { FormState } from "../actions";

export default function AuthForm({ mode, action }: { mode: "login" | "register"; action: (s: FormState, fd: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, {});
  const reg = mode === "register";
  return (
    <form action={formAction} className="card auth">
      <h1>{reg ? "Krijo llogari" : "Hyr"}</h1>
      {reg && <p className="muted">Merr 1,000 pikë virtuale falas për të filluar.</p>}
      <label>Emri i përdoruesit<input name="username" required autoComplete="username" /></label>
      <label>Fjalëkalimi<input name="password" type="password" required autoComplete={reg ? "new-password" : "current-password"} /></label>
      {state.error && <p className="err">{state.error}</p>}
      <button className="btn btn-accent block" disabled={pending}>{pending ? "…" : reg ? "Regjistrohu" : "Hyr"}</button>
      <p className="muted small">
        {reg ? <>Keni llogari? <Link href="/login">Hyni</Link></> : <>S'keni llogari? <Link href="/register">Regjistrohuni</Link></>}
      </p>
    </form>
  );
}
