import {
  SlashCommandBuilder, ChatInputCommandInteraction,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
} from 'discord.js';
import { kgEmbed, STYLE, steps } from '../lib/embedStyle.js';

export const data = new SlashCommandBuilder()
  .setName('apply')
  .setDescription('Otvori formu za prijavu na white listu');

export async function execute(interaction: ChatInputCommandInteraction) {
  const e = kgEmbed({
    title: 'White lista — prijava',
    banner: true,
    color: STYLE.brand,
    description: 'Klikni dugme ispod da otvoriš formu sa pet kratkih pitanja.',
    fields: [
      { name: 'Šta se traži', value: steps([
        ['Ime i prezime', 'IRL ime — koristi se za karakter'],
        ['Godine', '14+ obavezno'],
        ['RP iskustvo', 'Kratak opis prošlih servera/karaktera'],
        ['Ideja za lika', 'Ime, klasa, kratka pozadina'],
        ['Zašto baš naš server', 'Šta ti je privuklo pažnju'],
      ]) },
    ],
    footer: 'Admin tim odgovara DM-om u roku od 24h',
    guild: interaction.guild,
  });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('apply:start').setLabel('Otvori formu').setEmoji('📝').setStyle(ButtonStyle.Primary),
  );

  await interaction.reply({ embeds: [e], components: [row] });
}
