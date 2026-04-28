import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { db } from '../lib/store.js';
import { kgEmbed, STYLE } from '../lib/embedStyle.js';

export const data = new SlashCommandBuilder()
  .setName('warnings')
  .setDescription('Pregled warninga za korisnika (default: ti)')
  .addUserOption(o => o.setName('korisnik').setDescription('Čiji warningovi').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return;
  const target = interaction.options.getUser('korisnik') ?? interaction.user;

  const list = db.prepare(`
    SELECT id, actor_id, reason, created_at FROM warnings
    WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 25
  `).all(interaction.guildId!, target.id) as Array<{ id: number; actor_id: string; reason: string; created_at: number }>;

  const color = list.length >= 5 ? STYLE.danger : list.length >= 3 ? STYLE.danger : list.length >= 1 ? STYLE.warning : STYLE.success;

  const e = kgEmbed({
    title: `${list.length} ${list.length === 1 ? 'upozorenje' : 'upozorenja'}`,
    color,
    author: { name: target.tag, iconURL: target.displayAvatarURL() },
    thumbnail: target.displayAvatarURL({ size: 256 }),
    description: list.length === 0
      ? '_Čisto. Nema upozorenja._'
      : list.map(w => `**#${w.id}** — ${w.reason}\n_<t:${w.created_at}:R> od <@${w.actor_id}>_`).join('\n\n').slice(0, 4000),
    footer: 'Threshold: 3=timeout 1h • 5=timeout 24h • 7=auto-kick',
    guild: interaction.guild,
  });
  await interaction.reply({ embeds: [e], flags: MessageFlags.Ephemeral });
}
