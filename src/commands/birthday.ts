import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags,
} from 'discord.js';
import { setBirthday, getBirthday, deleteBirthday, upcomingBirthdays } from '../lib/birthdays.js';

const MONTHS = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];

export const data = new SlashCommandBuilder()
  .setName('birthday')
  .setDescription('Rođendani — postavi, pogledaj, lestvica')
  .addSubcommand(s =>
    s.setName('postavi').setDescription('Postavi svoj rođendan')
      .addIntegerOption(o => o.setName('dan').setDescription('1-31').setRequired(true).setMinValue(1).setMaxValue(31))
      .addIntegerOption(o => o.setName('mesec').setDescription('1-12').setRequired(true).setMinValue(1).setMaxValue(12))
      .addIntegerOption(o => o.setName('godina').setDescription('Opciono — godina rođenja').setRequired(false).setMinValue(1900).setMaxValue(2026)),
  )
  .addSubcommand(s =>
    s.setName('moj').setDescription('Pogledaj svoj postavljeni rođendan'),
  )
  .addSubcommand(s =>
    s.setName('obrisi').setDescription('Obriši svoj rođendan iz baze'),
  )
  .addSubcommand(s =>
    s.setName('sledeci').setDescription('Sledećih 10 rođendana na serveru'),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return;
  const guildId = interaction.guildId!;
  const userId = interaction.user.id;
  const sub = interaction.options.getSubcommand();

  if (sub === 'postavi') {
    const day = interaction.options.getInteger('dan', true);
    const month = interaction.options.getInteger('mesec', true);
    const year = interaction.options.getInteger('godina') ?? undefined;
    // Validacija: 31. februar nije ok
    const test = new Date(year ?? 2024, month - 1, day);
    if (test.getDate() !== day || test.getMonth() !== month - 1) {
      await interaction.reply({ content: 'Nevalidan datum.', flags: MessageFlags.Ephemeral });
      return;
    }
    setBirthday(userId, guildId, day, month, year);
    await interaction.reply({
      content: `🎂 Tvoj rođendan je postavljen na **${day}. ${MONTHS[month - 1]}**${year ? ` ${year}.` : ''}.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (sub === 'moj') {
    const b = getBirthday(userId, guildId);
    if (!b) {
      await interaction.reply({ content: 'Nemaš postavljen rođendan. Pokreni `/birthday postavi`.', flags: MessageFlags.Ephemeral });
      return;
    }
    await interaction.reply({
      content: `🎂 Tvoj rođendan: **${b.day}. ${MONTHS[b.month - 1]}**${b.year ? ` ${b.year}.` : ''}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (sub === 'obrisi') {
    deleteBirthday(userId, guildId);
    await interaction.reply({ content: '🗑️ Obrisano.', flags: MessageFlags.Ephemeral });
    return;
  }

  if (sub === 'sledeci') {
    const list = upcomingBirthdays(guildId, 10);
    const e = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle('🎂  Sledećih 10 rođendana')
      .setDescription(
        list.length === 0
          ? '_Niko još nije postavio rođendan. Budi prvi! `/birthday postavi`._'
          : list.map(b => `• <@${b.user_id}> — **${b.day}. ${MONTHS[b.month - 1]}**${b.year ? ` (${new Date().getFullYear() - b.year} god)` : ''}`).join('\n'),
      )
      .setFooter({ text: 'Bot čestita automatski u 9:00 ujutru.' });
    await interaction.reply({ embeds: [e] });
    return;
  }
}
