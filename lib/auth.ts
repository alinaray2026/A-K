import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { get, run } from "./db.ts";

const COOKIE = "session";
const DAYS = 30;

export type User = { id: number; username: string; balance: number; is_admin: number; last_bonus: string | null };

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return get<User>(
    `SELECT u.id, u.username, u.balance, u.is_admin, u.last_bonus FROM sessions s
     JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > datetime('now')`, token) ?? null;
}

export async function startSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  run(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+${DAYS} days'))`, token, userId);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: DAYS * 86400,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) run("DELETE FROM sessions WHERE token = ?", token);
  jar.delete(COOKIE);
}
