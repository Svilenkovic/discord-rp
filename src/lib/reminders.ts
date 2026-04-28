import { Client } from 'discord.js';
import { db } from './store.js';

export function scheduleReminderTick(client: Client) {
  async function tick() {
    const now = Math.floor(Date.now() / 1000);
    const due = db.prepare(`SELECT id, user_id, text FROM reminders WHERE fire_at <= ?`).all(now) as Array<{ id: number; user_id: string; text: string }>;

    for (const r of due) {
      try {
        const user = await client.users.fetch(r.user_id);
        await user.send({ content: `⏰ Podsetnik: **${r.text}**` });
      } catch {}
      db.prepare(`DELETE FROM reminders WHERE id = ?`).run(r.id);
    }
  }
  // Svakih 30s proveri
  setInterval(() => tick().catch(e => console.error('[reminders]', e)), 30_000);
  console.log('[reminders] tick zakazan (svakih 30s)');
}
