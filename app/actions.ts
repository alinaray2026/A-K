"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser, endSession, startSession } from "@/lib/auth";
import { get, getDb, run } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { placeBet, type SlipItem } from "@/lib/bets";
import { cancelMatch, settleMatch } from "@/lib/settle";
import { expectedGoals, oddsFor, simulateScore } from "@/lib/odds";
import { generateRound } from "@/lib/seed";

export type FormState = { error?: string; ok?: string };

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const username = String(fd.get("username") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  if (!/^[\p{L}0-9_.]{3,20}$/u.test(username)) return { error: "Emri: 3–20 shkronja, numra, _ ose ." };
  if (password.length < 6) return { error: "Fjalëkalimi duhet të ketë të paktën 6 karaktere" };
  if (get("SELECT id FROM users WHERE username = ?", username)) return { error: "Ky emër është i zënë" };
  const r = run("INSERT INTO users (username, password_hash) VALUES (?, ?)", username, hashPassword(password));
  await startSession(Number(r.lastInsertRowid));
  redirect("/");
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const username = String(fd.get("username") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const u = get<{ id: number; password_hash: string }>("SELECT id, password_hash FROM users WHERE username = ?", username);
  if (!u || !verifyPassword(password, u.password_hash)) return { error: "Emri ose fjalëkalimi i gabuar" };
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

export async function submitBet(items: SlipItem[], stake: number) {
  const u = await currentUser();
  if (!u) return { error: "Hyni në llogari për të vendosur bast" };
  try {
    const r = placeBet(u.id, items, stake);
    revalidatePath("/", "layout");
    return { ok: `Basti #${r.betId} u vendos! Fitimi i mundshëm: ${r.potential.toFixed(2)}` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ---------- Admin ----------
async function requireAdmin() {
  const u = await currentUser();
  if (!u?.is_admin) throw new Error("Vetëm për administratorë");
}

function done(msg: string): FormState {
  revalidatePath("/", "layout");
  return { ok: msg };
}

export async function adminAction(_: FormState, fd: FormData): Promise<FormState> {
  try {
    await requireAdmin();
    const op = String(fd.get("op"));
    const id = Number(fd.get("id"));
    if (op === "result") {
      const hg = Number(fd.get("hg")), ag = Number(fd.get("ag"));
      if (![hg, ag].every((n) => Number.isInteger(n) && n >= 0 && n < 30)) return { error: "Rezultat i pavlefshëm" };
      return done(`Rezultati u ruajt, ${settleMatch(id, hg, ag)} baste u shlyen`);
    }
    if (op === "simulate") {
      const m = get<{ home_xg: number; away_xg: number }>("SELECT home_xg, away_xg FROM matches WHERE id = ?", id);
      if (!m) return { error: "Ndeshja nuk u gjet" };
      const s = simulateScore(m.home_xg, m.away_xg);
      return done(`Simuluar ${s.home}-${s.away}, ${settleMatch(id, s.home, s.away)} baste u shlyen`);
    }
    if (op === "cancel") return done(`Ndeshja u anulua, ${cancelMatch(id)} baste u kthyen`);
    if (op === "round") return done(`U shtuan ${generateRound(getDb())} ndeshje të reja`);
    if (op === "create") {
      const league = String(fd.get("league") ?? "").trim();
      const home = String(fd.get("home") ?? "").trim();
      const away = String(fd.get("away") ?? "").trim();
      // datetime-local vjen pa zonë kohore; e korrigjojmë me ofsetin e shfletuesit
      const tz = Number(fd.get("tz") ?? 0);
      const kickoff = new Date(Date.parse(String(fd.get("kickoff")) + "Z") + tz * 60000);
      const hr = Number(fd.get("hr")), ar = Number(fd.get("ar"));
      if (!league || !home || !away || home === away) return { error: "Plotësoni ligën dhe dy ekipe të ndryshme" };
      if (isNaN(kickoff.getTime()) || kickoff <= new Date()) return { error: "Ora e fillimit duhet të jetë në të ardhmen" };
      if (![hr, ar].every((n) => n >= 1 && n <= 100)) return { error: "Vlerësimi duhet të jetë 1–100" };
      const xg = expectedGoals(hr, ar);
      const r = run("INSERT INTO matches (league, home, away, kickoff, home_xg, away_xg) VALUES (?, ?, ?, ?, ?, ?)",
        league, home, away, kickoff.toISOString(), xg.home, xg.away);
      for (const [sel, price] of Object.entries(oddsFor(xg.home, xg.away)))
        run("INSERT INTO odds (match_id, selection, price) VALUES (?, ?, ?)", Number(r.lastInsertRowid), sel, price);
      return done(`${home} – ${away} u shtua`);
    }
    return { error: "Veprim i panjohur" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
