"use client";
import { useActionState } from "react";
import Link from "next/link";
import type { FormState } from "../actions";

export default function AuthForm({ mode, action }: { mode: "login" | "register"; action: (s: FormState, fd: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, {});
  const reg = mode === "register";
  return (
    <form action={formAction} className="card auth">
      <h1>{reg ? "Create account" : "Log in"}</h1>
      {reg && <p className="muted">Get 1,000 free virtual points to start.</p>}
      <label>Username<input name="username" required autoComplete="username" /></label>
      <label>Password<input name="password" type="password" required autoComplete={reg ? "new-password" : "current-password"} /></label>
      {state.error && <p className="err">{state.error}</p>}
      <button className="btn btn-accent block" disabled={pending}>{pending ? "…" : reg ? "Sign up" : "Log in"}</button>
      <p className="muted small">
        {reg ? <>Have an account? <Link href="/login">Log in</Link></> : <>No account? <Link href="/register">Sign up</Link></>}
      </p>
    </form>
  );
}
