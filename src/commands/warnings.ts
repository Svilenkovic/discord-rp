import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags,
} from 'discord.js';
import { db } from '../lib/store.js';

export const data = new SlashCommandBuilder()
  .setName('warnings')
  .setDescription('Pregled warninga za korisnika (default: ti)')
  .addUserOption(o => o.setName('korisnik').setDescription('Čiji warningovi').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return;
  const target = interaction.options.getUser('korisnik') ?? interaction.user;

  const list = db.prepare(`
    SELECT id, actor_id, reason, created_at FROM warnings
    WHERE guild_id = ? AND user_id = ?
    ORDER BY created_at DESC LIMIT 25
  `).all(interaction.guildId!, target.id) as Array<{ id: number; actor_id: string; reason: string; created_at: number }>;

  const e = new EmbedBuilder()
    .setColor(list.length >= 3 ? 0xed4245 : list.length >= 1 ? 0xfee75c : 0x57f287)
    .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
    .setTitle(`⚠️  ${list.length} warninga`)
    .setDescription(
      list.length === 0
        ? '_Čisto. Nema upozorenja._'
        : list.map(w => `**#${w.id}** — ${w.reason}\n_<t:${w.created_at}:R> od <@${w.actor_id}>_`).join('\n\n').slice(0, 4000),
    );
  await interaction.reply({ embeds: [e], flags: MessageFlags.Ephemeral });
}
