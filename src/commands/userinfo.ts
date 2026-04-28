import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, time, TimestampStyles,
} from 'discord.js';
import { stmts } from '../lib/store.js';

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
    : recentLogs.map(l => `\`${l.action}\` <t:${l.created_at}:R> — ${l.reason ?? ''}`).join('\n');

  const e = new EmbedBuilder()
    .setColor(member?.displayHexColor === '#000000' ? 0x5865f2 : (member?.displayColor ?? 0x5865f2))
    .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL({ size: 256 }) })
    .setThumbnail(user.displayAvatarURL({ size: 512 }))
    .addFields(
      { name: 'ID', value: `\`${user.id}\``, inline: true },
      { name: 'Bot', value: user.bot ? 'Da' : 'Ne', inline: true },
      { name: '​', value: '​', inline: true },
      { name: 'Nalog otvoren', value: created, inline: true },
      { name: 'Pridružio se', value: joined, inline: true },
      { name: '​', value: '​', inline: true },
      { name: 'Uloge', value: roles, inline: false },
      { name: 'Mod-istorija (poslednjih 5)', value: modHistory, inline: false },
    );
  await interaction.reply({ embeds: [e] });
}
