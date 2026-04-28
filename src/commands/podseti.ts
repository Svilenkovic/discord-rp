import {
  SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags,
} from 'discord.js';
import { db } from '../lib/store.js';

const UNIT_SECONDS: Record<string, number> = { min: 60, h: 3600, d: 86400 };

export const data = new SlashCommandBuilder()
  .setName('podseti')
  .setDescription('Pošalje ti DM podsetnik posle X vremena (max 30 dana)')
  .addStringOption(o => o.setName('za').setDescription('Vreme: 10min / 2h / 1d').setRequired(true).setMaxLength(10))
  .addStringOption(o => o.setName('tekst').setDescription('Šta da te podsetim').setRequired(true).setMaxLength(500));

export async function execute(interaction: ChatInputCommandInteraction) {
  const za = interaction.options.getString('za', true).toLowerCase().trim();
  const tekst = interaction.options.getString('tekst', true);

  const m = za.match(/^(\d+)(min|h|d)$/);
  if (!m) {
    await interaction.reply({ content: 'Format: `10min`, `2h`, `1d` (samo brojevi + jedinice).', flags: MessageFlags.Ephemeral });
    return;
  }
  const amount = parseInt(m[1], 10);
  const unit = m[2];
  const seconds = amount * UNIT_SECONDS[unit];
  if (seconds > 30 * 86400) {
    await interaction.reply({ content: 'Maksimum je 30 dana.', flags: MessageFlags.Ephemeral });
    return;
  }
  if (seconds < 60) {
    await interaction.reply({ content: 'Minimum je 1 min.', flags: MessageFlags.Ephemeral });
    return;
  }

  const fireAt = Math.floor(Date.now() / 1000) + seconds;
  db.prepare(`INSERT INTO reminders (user_id, text, fire_at) VALUES (?, ?, ?)`).run(interaction.user.id, tekst, fireAt);

  await interaction.reply({
    content: `⏰ Podsetiću te <t:${fireAt}:R> (<t:${fireAt}:F>) na: **${tekst}**`,
    flags: MessageFlags.Ephemeral,
  });
}
