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
};

export { db };
