import { Client, ChannelType, EmbedBuilder, TextChannel } from 'discord.js';
import { db } from './store.js';

export function setBirthday(userId: string, guildId: string, day: number, month: number, year?: number) {
  db.prepare(`
    INSERT INTO birthdays (user_id, guild_id, day, month, year)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, guild_id) DO UPDATE SET day = excluded.day, month = excluded.month, year = excluded.year
  `).run(userId, guildId, day, month, year ?? null);
}

export function getBirthday(userId: string, guildId: string) {
  return db.prepare(`SELECT * FROM birthdays WHERE user_id = ? AND guild_id = ?`).get(userId, guildId) as
    | { user_id: string; guild_id: string; day: number; month: number; year: number | null; last_celebrated: number } | undefined;
}

export function deleteBirthday(userId: string, guildId: string) {
  db.prepare(`DELETE FROM birthdays WHERE user_id = ? AND guild_id = ?`).run(userId, guildId);
}

export function todaysBirthdays(guildId: string) {
  const now = new Date();
  return db.prepare(`SELECT * FROM birthdays WHERE guild_id = ? AND day = ? AND month = ?`)
    .all(guildId, now.getDate(), now.getMonth() + 1) as Array<{ user_id: string; year: number | null; last_celebrated: number }>;
}

export function upcomingBirthdays(guildId: string, limit = 10) {
  const rows = db.prepare(`SELECT user_id, day, month, year FROM birthdays WHERE guild_id = ?`)
    .all(guildId) as Array<{ user_id: string; day: number; month: number; year: number | null }>;
  const now = new Date();
  const todayMD = now.getMonth() * 100 + now.getDate();
  const withDays = rows.map(r => {
    const md = (r.month - 1) * 100 + r.day;
    let daysUntil = md - todayMD;
    if (daysUntil < 0) daysUntil += 1200; // jednostavno wrap-around (nije tačno ali OK za sortiranje)
    return { ...r, daysUntil };
  });
  withDays.sort((a, b) => a.daysUntil - b.daysUntil);
  return withDays.slice(0, limit);
}

export function markCelebrated(userId: string, guildId: string) {
  db.prepare(`UPDATE birthdays SET last_celebrated = ? WHERE user_id = ? AND guild_id = ?`)
    .run(Math.floor(Date.now() / 1000), userId, guildId);
}

export async function runBirthdayCheck(client: Client) {
  for (const [, guild] of client.guilds.cache) {
    const today = todaysBirthdays(guild.id);
    if (today.length === 0) continue;

    // Nadji welcome ili general kanal
    const channels = await guild.channels.fetch();
    const welcomeCh = [...channels.values()].find(
      c => c?.type === ChannelType.GuildText && /opsti-chat|opštI-chat|ᴏᴘꜱᴛɪ-ᴄʜᴀᴛ|general/i.test(c.name),
    ) as TextChannel | undefined;
    if (!welcomeCh) continue;

    const todayUnix = Math.floor(Date.now() / 1000);
    const dayBucket = Math.floor(todayUnix / 86400);

    for (const b of today) {
      // Ne čestitaj dva puta isti dan
      if (b.last_celebrated && Math.floor(b.last_celebrated / 86400) === dayBucket) continue;

      const age = b.year ? new Date().getFullYear() - b.year : null;
      const e = new EmbedBuilder()
        .setColor(0xfee75c)
        .setTitle('🎂  Srećan rođendan!')
        .setDescription(`<@${b.user_id}> danas slavi${age ? ` svoj **${age}.**` : ''} rođendan!\n\n🎉 Sve najbolje od KG Balkan RP tima i celog server-a! 🎉`);
      await welcomeCh.send({ content: `<@${b.user_id}>`, embeds: [e] }).catch(() => {});
      markCelebrated(b.user_id, guild.id);
    }
  }
}

export function scheduleDailyBirthdayCheck(client: Client) {
  // Svakog dana u 9:00 lokalno
  function scheduleNext() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(9, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const ms = next.getTime() - now.getTime();
    setTimeout(async () => {
      try { await runBirthdayCheck(client); } catch (e) { console.error('[birthday]', e); }
      scheduleNext();
    }, ms);
    console.log(`[birthday] sledeća provera za ${Math.round(ms / 60000)} min`);
  }
  scheduleNext();
}
