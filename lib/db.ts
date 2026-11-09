import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { hashPassword } from "./password.ts";
import { seed } from "./seed.ts";

const g = globalThis as unknown as { __db?: DatabaseSync };

export function getDb() {
  if (!g.__db) {
    const file = process.env.DB_FILE ?? path.join(process.cwd(), "data", "bast.db");
    if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
    const db = new DatabaseSync(file);
    db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    migrate(db);
    g.__db = db;
  }
  return g.__db;
}

function migrate(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 1000,
      is_admin INTEGER NOT NULL DEFAULT 0,
      last_bonus TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      league TEXT NOT NULL,
      home TEXT NOT NULL,
      away TEXT NOT NULL,
      kickoff TEXT NOT NULL,
      home_xg REAL NOT NULL,
      away_xg REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled',
      home_goals INTEGER,
      away_goals INTEGER
    );
    CREATE TABLE IF NOT EXISTS odds (
      match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      selection TEXT NOT NULL,
      price REAL NOT NULL,
      PRIMARY KEY (match_id, selection)
    );
    CREATE TABLE IF NOT EXISTS bets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      stake REAL NOT NULL,
      total_odds REAL NOT NULL,
      potential_win REAL NOT NULL,
      payout REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      settled_at TEXT
    );
    CREATE TABLE IF NOT EXISTS bet_selections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bet_id INTEGER NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
      match_id INTEGER NOT NULL REFERENCES matches(id),
      selection TEXT NOT NULL,
      price REAL NOT NULL,
      result TEXT NOT NULL DEFAULT 'pending'
    );
    CREATE INDEX IF NOT EXISTS idx_sel_match ON bet_selections(match_id);
    CREATE INDEX IF NOT EXISTS idx_bets_user ON bets(user_id);
  `);
  const count = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  if (count.n === 0) {
    db.prepare("INSERT INTO users (username, password_hash, is_admin, balance) VALUES (?, ?, 1, 1000)")
      .run("admin", hashPassword(process.env.ADMIN_PASSWORD ?? "admin123"));
    seed(db);
  }
}

type Row = Record<string, unknown>;
type P = SQLInputValue;

export function all<T = Row>(sql: string, ...params: P[]): T[] {
  return getDb().prepare(sql).all(...params).map((r) => ({ ...r })) as T[];
}
export function get<T = Row>(sql: string, ...params: P[]): T | undefined {
  const r = getDb().prepare(sql).get(...params);
  return r ? ({ ...r } as T) : undefined;
}
export function run(sql: string, ...params: P[]) {
  return getDb().prepare(sql).run(...params);
}
export function tx<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const r = fn();
    db.exec("COMMIT");
    return r;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
