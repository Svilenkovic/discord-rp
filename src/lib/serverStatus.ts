import { Client, ChannelType, EmbedBuilder, TextChannel } from 'discord.js';
import { db } from './store.js';
import { getStatus } from './fivem.js';

const REFRESH_MS = 60_000; // 1 min

function buildEmbed(s: Awaited<ReturnType<typeof getStatus>>, ip: string): EmbedBuilder {
  if (!s.online) {
    return new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('🔴  Server je offline')
      .setDescription(`Nije moguće dobiti odgovor od \`${ip}\`.`)
      .setFooter({ text: 'Auto-refresh svaki minut' })
      .setTimestamp();
  }
  const filled = Math.round(((s.players ?? 0) / (s.maxPlayers ?? 1)) * 20);
  const bar = '█'.repeat(Math.min(20, filled)) + '░'.repeat(20 - Math.min(20, filled));
  return new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`🟢  ${s.hostname ?? 'KG Balkan RP'}`)
    .setDescription([
      `**Igrača:** ${s.players}/${s.maxPlayers}${s.queue ? ` _(queue: ${s.queue})_` : ''}`,
      `\`${bar}\``,
      ``,
      `**Resursi:** ${s.resources}`,
      s.gametype ? `**Gametype:** ${s.gametype}` : '',
      s.mapname ? `**Mapa:** ${s.mapname}` : '',
      ``,
      `**Connect:** F8 → \`connect ${ip}\``,
    ].filter(Boolean).join('\n'))
    .setFooter({ text: `Auto-refresh svaki minut • IP: ${ip}` })
    .setTimestamp();
}

export async function refreshStatusEmbed(client: Client) {
  const ip = process.env.FIVEM_SERVER_IP;
  if (!ip) return;

  for (const [, guild] of client.guilds.cache) {
    const channels = await guild.channels.fetch().catch(() => null);
    if (!channels) continue;

    const statusCh = [...channels.values()].find(
      c => c?.type === ChannelType.GuildText && /status-servera|ꜱᴛᴀᴛᴜꜱ-ꜱᴇʀᴠᴇʀᴀ/i.test(c.name),
    ) as TextChannel | undefined;
    if (!statusCh) continue;

    const status = await getStatus(ip);
    const embed = buildEmbed(status, ip);

    // Postoji li već sticky poruka?
    const existing = db.prepare(`SELECT * FROM status_messages WHERE guild_id = ?`).get(guild.id) as
      | { channel_id: string; message_id: string } | undefined;

    let updated = false;
    if (existing && existing.channel_id === statusCh.id) {
      try {
        const msg = await statusCh.messages.fetch(existing.message_id);
        await msg.edit({ embeds: [embed] });
        db.prepare(`UPDATE status_messages SET updated_at = unixepoch() WHERE guild_id = ?`).run(guild.id);
        updated = true;
      } catch {
        // Poruka obrisana — fallback na kreiranje nove
      }
    }
    if (!updated) {
      const sent = await statusCh.send({ embeds: [embed] }).catch(() => null);
      if (sent) {
        db.prepare(`
          INSERT INTO status_messages (guild_id, channel_id, message_id, updated_at)
          VALUES (?, ?, ?, unixepoch())
          ON CONFLICT(guild_id) DO UPDATE SET channel_id = excluded.channel_id, message_id = excluded.message_id, updated_at = unixepoch()
        `).run(guild.id, statusCh.id, sent.id);
      }
    }
  }
}

export function scheduleStatusRefresh(client: Client) {
  // Prvi run nakon 10s, pa svaki minut
  setTimeout(() => {
    refreshStatusEmbed(client).catch(e => console.error('[status]', e));
    setInterval(() => refreshStatusEmbed(client).catch(e => console.error('[status]', e)), REFRESH_MS);
  }, 10_000);
  console.log('[status] auto-refresh zakazan (svaki minut)');
}
