"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { currentUser, endSession, startSession } from "@/lib/auth";
import { get, getDb, run } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { placeBet, type SlipItem } from "@/lib/bets";
import { cancelMatch, settleMatch } from "@/lib/settle";
import { expectedGoals, oddsFor, simulateScore } from "@/lib/odds";
import { generateRound } from "@/lib/seed";
import { AppError } from "@/lib/errors";
import { fill, LANGS, type Dict, type ErrCode } from "@/lib/i18n";
import { getDict } from "@/lib/lang";
import { money } from "@/lib/format";

export type FormState = { error?: string; ok?: string };

function errText(d: Dict, e: unknown) {
  if (e instanceof AppError) return fill(d.err[e.code], e.vars);
  console.error(e);
  return d.err.unknown;
}
const fail = (d: Dict, code: ErrCode): FormState => ({ error: d.err[code] });

export async function setLang(lang: string) {
  if (!(LANGS as readonly string[]).includes(lang)) return;
  (await cookies()).set("lang", lang, { path: "/", maxAge: 365 * 86400, sameSite: "lax" });
  revalidatePath("/", "layout");
}

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const d = await getDict();
  const username = String(fd.get("username") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  if (!/^[\p{L}0-9_.]{3,20}$/u.test(username)) return fail(d, "username");
  if (password.length < 6) return fail(d, "password");
  if (get("SELECT id FROM users WHERE username = ?", username)) return fail(d, "taken");
  const r = run("INSERT INTO users (username, password_hash) VALUES (?, ?)", username, hashPassword(password));
  await startSession(Number(r.lastInsertRowid));
  redirect("/");
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const d = await getDict();
  const username = String(fd.get("username") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const u = get<{ id: number; password_hash: string }>("SELECT id, password_hash FROM users WHERE username = ?", username);
  if (!u || !verifyPassword(password, u.password_hash)) return fail(d, "wrongLogin");
  await startSession(u.id);
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/");
}

export async function claimBonus() {
  const u = await currentUser();
  if (!u) redirect("/login");
  const today = new Date().toISOString().slice(0, 10);
  run("UPDATE users SET balance = balance + 100, last_bonus = ? WHERE id = ? AND (last_bonus IS NULL OR last_bonus <> ?)",
    today, u.id, today);
  revalidatePath("/", "layout");
}

export async function submitBet(items: SlipItem[], stake: number): Promise<FormState> {
  const d = await getDict();
  const u = await currentUser();
  if (!u) return fail(d, "loginToBet");
  try {
    const r = placeBet(u.id, items, stake);
    revalidatePath("/", "layout");
    return { ok: fill(d.msg.betPlaced, { id: r.betId, win: money(r.potential, d.locale) }) };
  } catch (e) {
    return { error: errText(d, e) };
  }
}

// ---------- Admin ----------
export async function adminAction(_: FormState, fd: FormData): Promise<FormState> {
  const d = await getDict();
  const done = (msg: string): FormState => { revalidatePath("/", "layout"); return { ok: msg }; };
  try {
    if (!(await currentUser())?.is_admin) return fail(d, "adminsOnly");
    const op = String(fd.get("op"));
    const id = Number(fd.get("id"));
    if (op === "result") {
      const hg = Number(fd.get("hg")), ag = Number(fd.get("ag"));
      if (![hg, ag].every((n) => Number.isInteger(n) && n >= 0 && n < 30)) return fail(d, "invalidScore");
      return done(fill(d.msg.scoreSaved, { n: settleMatch(id, hg, ag) }));
    }
    if (op === "simulate") {
      const m = get<{ home_xg: number; away_xg: number }>("SELECT home_xg, away_xg FROM matches WHERE id = ?", id);
      if (!m) return fail(d, "matchNotFound");
      const s = simulateScore(m.home_xg, m.away_xg);
      return done(fill(d.msg.simulated, { score: `${s.home}-${s.away}`, n: settleMatch(id, s.home, s.away) }));
    }
    if (op === "cancel") return done(fill(d.msg.matchCancelled, { n: cancelMatch(id) }));
    if (op === "round") return done(fill(d.msg.roundAdded, { n: generateRound(getDb()) }));
    if (op === "create") {
      const league = String(fd.get("league") ?? "").trim();
      const home = String(fd.get("home") ?? "").trim();
      const away = String(fd.get("away") ?? "").trim();
      // datetime-local has no time zone; correct it with the browser's offset
      const tz = Number(fd.get("tz") ?? 0);
      const kickoff = new Date(Date.parse(String(fd.get("kickoff")) + "Z") + tz * 60000);
      const hr = Number(fd.get("hr")), ar = Number(fd.get("ar"));
      if (!league || !home || !away || home === away) return fail(d, "leagueTeams");
      if (isNaN(kickoff.getTime()) || kickoff <= new Date()) return fail(d, "kickoffFuture");
      if (![hr, ar].every((n) => n >= 1 && n <= 100)) return fail(d, "rating");
      const xg = expectedGoals(hr, ar);
      const r = run("INSERT INTO matches (league, home, away, kickoff, home_xg, away_xg) VALUES (?, ?, ?, ?, ?, ?)",
        league, home, away, kickoff.toISOString(), xg.home, xg.away);
      for (const [sel, p] of Object.entries(oddsFor(xg.home, xg.away)))
        run("INSERT INTO odds (match_id, selection, price) VALUES (?, ?, ?)", Number(r.lastInsertRowid), sel, p);
      return done(fill(d.msg.matchAdded, { match: `${home} – ${away}` }));
    }
    return fail(d, "unknown");
  } catch (e) {
    return { error: errText(d, e) };
  }
}
