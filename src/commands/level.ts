import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { db } from '../lib/store.js';
import { progressInLevel } from '../lib/levels.js';
import { kgEmbed, STYLE, rankList, progressBar, field } from '../lib/embedStyle.js';

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
    const rank = (db.prepare(`SELECT COUNT(*) + 1 AS r FROM xp WHERE guild_id = ? AND xp > ?`)
      .get(guildId, xp) as any).r;

    const e = kgEmbed({
      title: `Level ${p.level}`,
      description: `\`${progressBar(p.pct)}\``,
      color: STYLE.primary,
      author: { name: user.tag, iconURL: user.displayAvatarURL() },
      thumbnail: user.displayAvatarURL({ size: 256 }),
      fields: [
        field('XP u levelu', `${p.current} / ${p.needed}`, true),
        field('Total XP', `${xp}`, true),
        field('Rang', `#${rank}`, true),
      ],
      guild: interaction.guild,
    });
    await interaction.reply({ embeds: [e] });
    return;
  }

  if (sub === 'top') {
    const top = db.prepare(`SELECT user_id, xp, level FROM xp WHERE guild_id = ? ORDER BY xp DESC LIMIT 10`)
      .all(guildId) as Array<{ user_id: string; xp: number; level: number }>;

    const e = kgEmbed({
      title: 'Top 10 — lestvica nivoa',
      banner: true,
      color: STYLE.brand,
      description: top.length === 0
        ? '_Lestvica je prazna. Razgovaraj sa drugima da skupiš XP._'
        : rankList(top, r => `<@${r.user_id}> — **Level ${r.level}** _(${r.xp} XP)_`),
      guild: interaction.guild,
      footer: 'XP se zarađuje porukama (8-18 XP po poruci, 60s cooldown)',
    });
    await interaction.reply({ embeds: [e] });
    return;
  }
}
