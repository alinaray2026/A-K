"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import type { FormState } from "../actions";
import type { Dict } from "@/lib/i18n";

export default function AuthForm({ d, mode, action }: { d: Dict; mode: "login" | "register"; action: (s: FormState, fd: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, {});
  const reg = mode === "register";
  const [username, setUsername] = useState(""); // controlled, so it survives the form reset after an error
  return (
    <form action={formAction} className="card auth">
      <h1>{reg ? d.auth.createAccount : d.auth.login}</h1>
      {reg && <p className="muted">{d.auth.startBonus}</p>}
      <label>{d.auth.username}<input name="username" required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} /></label>
      <label>{d.auth.password}<input name="password" type="password" required autoComplete={reg ? "new-password" : "current-password"} /></label>
      {state.error && <p className="err">{state.error}</p>}
      <button className="btn btn-accent block" disabled={pending}>{pending ? "…" : reg ? d.auth.signup : d.auth.login}</button>
      <p className="muted small">
        {reg ? <>{d.auth.haveAccount} <Link href="/login">{d.auth.login}</Link></> : <>{d.auth.noAccount} <Link href="/register">{d.auth.signup}</Link></>}
      </p>
    </form>
  );
}
