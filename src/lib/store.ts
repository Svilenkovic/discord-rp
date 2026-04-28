import Database from 'better-sqlite3';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';

const dataDir = join(process.cwd(), 'data');
mkdirSync(dataDir, { recursive: true });

const db = new Database(join(dataDir, 'rp.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS characters (
    user_id    TEXT NOT NULL,
    guild_id   TEXT NOT NULL,
    name       TEXT NOT NULL,
    class      TEXT DEFAULT 'commoner',
    level      INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (user_id, guild_id)
  );

  CREATE TABLE IF NOT EXISTS scenes (
    guild_id    TEXT PRIMARY KEY,
    location    TEXT NOT NULL,
    description TEXT,
    started_by  TEXT NOT NULL,
    started_at  INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS scene_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id   TEXT NOT NULL,
    user_id    TEXT NOT NULL,
    text       TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );
  CREATE INDEX IF NOT EXISTS idx_scene_log_guild_time ON scene_log(guild_id, created_at);

  CREATE TABLE IF NOT EXISTS tickets (
    channel_id TEXT PRIMARY KEY,
    guild_id   TEXT NOT NULL,
    user_id    TEXT NOT NULL,
    topic      TEXT NOT NULL,
    status     TEXT DEFAULT 'open',
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS applications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id    TEXT NOT NULL,
    user_id     TEXT NOT NULL,
    real_name   TEXT,
    age         TEXT,
    rp_exp      TEXT,
    character   TEXT,
    why_us      TEXT,
    status      TEXT DEFAULT 'pending',
    decided_by  TEXT,
    decided_at  INTEGER,
    message_id  TEXT,
    created_at  INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS mod_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id   TEXT NOT NULL,
    user_id    TEXT NOT NULL,
    actor_id   TEXT,
    action     TEXT NOT NULL,
    reason     TEXT,
    duration_s INTEGER,
    created_at INTEGER DEFAULT (unixepoch())
  );
  CREATE INDEX IF NOT EXISTS idx_mod_logs_user ON mod_logs(user_id, created_at);

  -- XP / leveling
  CREATE TABLE IF NOT EXISTS xp (
    user_id    TEXT NOT NULL,
    guild_id   TEXT NOT NULL,
    xp         INTEGER DEFAULT 0,
    level      INTEGER DEFAULT 0,
    last_msg   INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, guild_id)
  );
  CREATE INDEX IF NOT EXISTS idx_xp_top ON xp(guild_id, xp DESC);

  -- Donacije (record-keeping)
  CREATE TABLE IF NOT EXISTS donations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id    TEXT NOT NULL,
    user_id     TEXT NOT NULL,
    package     TEXT NOT NULL,
    amount      REAL,
    note        TEXT,
    status      TEXT DEFAULT 'pending',
    handled_by  TEXT,
    handled_at  INTEGER,
    created_at  INTEGER DEFAULT (unixepoch())
  );

  -- Promoter codes
  CREATE TABLE IF NOT EXISTS promoter_codes (
    code       TEXT PRIMARY KEY,
    guild_id   TEXT NOT NULL,
    user_id    TEXT NOT NULL,
    uses       INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch())
  );

  -- Promoter referrals (ko je doveo koga)
  CREATE TABLE IF NOT EXISTS promoter_refs (
    referred_user TEXT NOT NULL,
    guild_id      TEXT NOT NULL,
    code          TEXT NOT NULL,
    promoter_id   TEXT NOT NULL,
    confirmed     INTEGER DEFAULT 0,
    created_at    INTEGER DEFAULT (unixepoch()),
    PRIMARY KEY (referred_user, guild_id)
  );
  CREATE INDEX IF NOT EXISTS idx_promoter_refs_promoter ON promoter_refs(promoter_id, confirmed);
`);

export const stmts = {
  createChar: db.prepare(
    `INSERT INTO characters (user_id, guild_id, name, class) VALUES (?, ?, ?, ?)`,
  ),
  getChar: db.prepare(`SELECT * FROM characters WHERE user_id = ? AND guild_id = ?`),
  deleteChar: db.prepare(`DELETE FROM characters WHERE user_id = ? AND guild_id = ?`),

  startScene: db.prepare(
    `INSERT OR REPLACE INTO scenes (guild_id, location, description, started_by, started_at)
     VALUES (?, ?, ?, ?, unixepoch())`,
  ),
  getScene: db.prepare(`SELECT * FROM scenes WHERE guild_id = ?`),
  endScene: db.prepare(`DELETE FROM scenes WHERE guild_id = ?`),
  endSceneLog: db.prepare(`DELETE FROM scene_log WHERE guild_id = ?`),
  addLog: db.prepare(
    `INSERT INTO scene_log (guild_id, user_id, text) VALUES (?, ?, ?)`,
  ),
  recentLog: db.prepare(
    `SELECT user_id, text, created_at FROM scene_log
     WHERE guild_id = ? ORDER BY created_at DESC LIMIT ?`,
  ),

  // Tickets
  createTicket: db.prepare(
    `INSERT INTO tickets (channel_id, guild_id, user_id, topic) VALUES (?, ?, ?, ?)`,
  ),
  getTicket: db.prepare(`SELECT * FROM tickets WHERE channel_id = ?`),
  closeTicket: db.prepare(`UPDATE tickets SET status='closed' WHERE channel_id = ?`),
  userOpenTickets: db.prepare(
    `SELECT COUNT(*) as n FROM tickets WHERE guild_id = ? AND user_id = ? AND status = 'open'`,
  ),

  // Applications
  createApp: db.prepare(
    `INSERT INTO applications (guild_id, user_id, real_name, age, rp_exp, character, why_us, message_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ),
  getApp: db.prepare(`SELECT * FROM applications WHERE id = ?`),
  decideApp: db.prepare(
    `UPDATE applications SET status = ?, decided_by = ?, decided_at = unixepoch() WHERE id = ?`,
  ),
  pendingApps: db.prepare(
    `SELECT COUNT(*) as n FROM applications WHERE guild_id = ? AND user_id = ? AND status = 'pending'`,
  ),

  // Mod logs
  addModLog: db.prepare(
    `INSERT INTO mod_logs (guild_id, user_id, actor_id, action, reason, duration_s) VALUES (?, ?, ?, ?, ?, ?)`,
  ),
  recentModLogs: db.prepare(
    `SELECT * FROM mod_logs WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT ?`,
  ),
};

export { db };
