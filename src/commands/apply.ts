import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('apply')
  .setDescription('Otvori formu za prijavu na belu listu (whitelist)');

export async function execute(interaction: ChatInputCommandInteraction) {
  const e = new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle('📝  Prijava za belu listu')
    .setDescription([
      'Klikni dugme ispod da otvoriš formu sa pet kratkih pitanja:',
      '',
      '• Ime i prezime (IRL)',
      '• Godine',
      '• RP iskustvo',
      '• Ideja za lika (ime, pozadina)',
      '• Zašto baš naš server?',
      '',
      'Admin tim će proceniti prijavu i obavestiti te DM-om u roku od 24h.',
    ].join('\n'));

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('apply:start').setLabel('Otvori formu').setEmoji('📝').setStyle(ButtonStyle.Primary),
  );

  await interaction.reply({ embeds: [e], components: [row] });
}
