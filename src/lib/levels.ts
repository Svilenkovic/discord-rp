// XP / leveling — Discord activity tracking

import { db } from './store.js';

const XP_PER_MSG_MIN = 8;
const XP_PER_MSG_MAX = 18;
const COOLDOWN_MS = 60_000; // jedan XP gain po minutu max

// Klasična RuneScape-style: 5*L^2 + 50*L + 100
export function xpRequired(level: number): number {
  return Math.floor(5 * Math.pow(level, 2) + 50 * level + 100);
}

export function totalXpToReach(level: number): number {
  let s = 0;
  for (let l = 0; l < level; l++) s += xpRequired(l);
  return s;
}

export function levelFromXp(xp: number): number {
  let level = 0;
  while (xp >= xpRequired(level)) { xp -= xpRequired(level); level++; }
  return level;
}

export function progressInLevel(xp: number): { level: number; current: number; needed: number; pct: number } {
  let level = 0;
  let remaining = xp;
  while (remaining >= xpRequired(level)) { remaining -= xpRequired(level); level++; }
  const needed = xpRequired(level);
  return { level, current: remaining, needed, pct: remaining / needed };
}

export interface XpAward {
  oldLevel: number;
  newLevel: number;
  totalXp: number;
}

export function awardMessageXp(guildId: string, userId: string): XpAward | null {
  const now = Date.now();
  const row = db.prepare(`SELECT xp, level, last_msg FROM xp WHERE user_id = ? AND guild_id = ?`)
    .get(userId, guildId) as { xp: number; level: number; last_msg: number } | undefined;

  const last = row?.last_msg ?? 0;
  if (now - last < COOLDOWN_MS) return null;

  const gain = XP_PER_MSG_MIN + Math.floor(Math.random() * (XP_PER_MSG_MAX - XP_PER_MSG_MIN + 1));
  const oldXp = row?.xp ?? 0;
  const oldLevel = row?.level ?? 0;
  const newXp = oldXp + gain;
  const newLevel = levelFromXp(newXp);

  if (row) {
    db.prepare(`UPDATE xp SET xp = ?, level = ?, last_msg = ? WHERE user_id = ? AND guild_id = ?`)
      .run(newXp, newLevel, now, userId, guildId);
  } else {
    db.prepare(`INSERT INTO xp (user_id, guild_id, xp, level, last_msg) VALUES (?, ?, ?, ?, ?)`)
      .run(userId, guildId, newXp, newLevel, now);
  }

  return { oldLevel, newLevel, totalXp: newXp };
}
