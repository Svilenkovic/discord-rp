import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags,
} from 'discord.js';
import { db } from '../lib/store.js';
import { progressInLevel } from '../lib/levels.js';

export const data = new SlashCommandBuilder()
  .setName('level')
  .setDescription('Pogledaj svoj level i XP')
  .addSubcommand(s => s.setName('moj').setDescription('Tvoj nivo i XP')
    .addUserOption(o => o.setName('korisnik').setDescription('Tudji nivo (opciono)').setRequired(false)))
  .addSubcommand(s => s.setName('top').setDescription('Top 10 igrača na serveru'));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return;
  const guildId = interaction.guildId!;
  const sub = interaction.options.getSubcommand();

  if (sub === 'moj') {
    const user = interaction.options.getUser('korisnik') ?? interaction.user;
    const row = db.prepare(`SELECT xp FROM xp WHERE user_id = ? AND guild_id = ?`)
      .get(user.id, guildId) as { xp: number } | undefined;
    const xp = row?.xp ?? 0;
    const p = progressInLevel(xp);
    const filled = Math.round(p.pct * 20);
    const bar = '█'.repeat(Math.min(20, filled)) + '░'.repeat(20 - Math.min(20, filled));

    // Rank
    const rank = (db.prepare(`SELECT COUNT(*) + 1 AS r FROM xp WHERE guild_id = ? AND xp > ?`)
      .get(guildId, xp) as any).r;

    const e = new EmbedBuilder()
      .setColor(0x5865f2)
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
      .setTitle(`Level ${p.level}`)
      .addFields(
        { name: 'XP', value: `${p.current} / ${p.needed}`, inline: true },
        { name: 'Total XP', value: String(xp), inline: true },
        { name: 'Rang', value: `#${rank}`, inline: true },
      )
      .setDescription(`\`${bar}\``);

    await interaction.reply({ embeds: [e] });
    return;
  }

  if (sub === 'top') {
    const top = db.prepare(`SELECT user_id, xp, level FROM xp WHERE guild_id = ? ORDER BY xp DESC LIMIT 10`)
      .all(guildId) as Array<{ user_id: string; xp: number; level: number }>;

    const e = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🏆  Top 10 — Lestvica nivoa')
      .setDescription(
        top.length === 0
          ? '_Lestvica je prazna. Razgovaraj da skupiš XP!_'
          : top.map((r, i) => {
              const m = ['🥇','🥈','🥉','4.','5.','6.','7.','8.','9.','10.'][i];
              return `${m} <@${r.user_id}> — **Level ${r.level}** (${r.xp} XP)`;
            }).join('\n'),
      );
    await interaction.reply({ embeds: [e] });
    return;
  }
}
