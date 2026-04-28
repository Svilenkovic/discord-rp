import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { stmts } from '../lib/store.js';
import { kgEmbed, STYLE, field } from '../lib/embedStyle.js';

export const data = new SlashCommandBuilder()
  .setName('userinfo')
  .setDescription('Prikaži informacije o korisniku')
  .addUserOption(o => o.setName('korisnik').setDescription('Koga gledamo (default: ti)').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return;
  const user = interaction.options.getUser('korisnik') ?? interaction.user;
  const member = await interaction.guild.members.fetch(user.id).catch(() => null);

  const created = `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`;
  const joined = member ? `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>` : '_nije na serveru_';

  const roles = member
    ? [...member.roles.cache.values()]
        .filter(r => r.id !== interaction.guild!.id)
        .sort((a, b) => b.position - a.position)
        .slice(0, 12)
        .map(r => `<@&${r.id}>`).join(' ') || '_nema_'
    : '_nije na serveru_';

  const recentLogs = stmts.recentModLogs.all(interaction.guildId!, user.id, 5) as any[];
  const modHistory = recentLogs.length === 0
    ? '_čisto_'
    : recentLogs.map(l => `\`${l.action}\` <t:${l.created_at}:R> — ${(l.reason ?? '').slice(0, 80)}`).join('\n');

  const color = (member?.displayColor && member.displayColor !== 0) ? member.displayColor : STYLE.primary;

  const e = kgEmbed({
    title: user.tag,
    color,
    author: { name: 'Informacije o korisniku' },
    thumbnail: user.displayAvatarURL({ size: 512 }),
    fields: [
      field('ID', `\`${user.id}\``, true),
      field('Bot', user.bot ? 'Da' : 'Ne', true),
      field('​', '​', true),
      field('Nalog otvoren', created, true),
      field('Pridružio se', joined, true),
      field('​', '​', true),
      field('Uloge', roles, false),
      field('Mod-istorija (5)', modHistory, false),
    ],
    guild: interaction.guild,
  });
  await interaction.reply({ embeds: [e] });
}
