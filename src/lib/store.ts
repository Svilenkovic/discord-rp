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
`);

export const stmts = {
  createChar: db.prepare(
    `INSERT INTO characters (user_id, guild_id, name, class) VALUES (?, ?, ?, ?)`,
  ),
  getChar: db.prepare(`SELECT * FROM characters WHERE user_id = ? AND guild_id = ?`),
  deleteChar: db.prepare(`DELETE FROM characters WHERE user_id = ? AND guild_id = ?`),
};

export { db };
