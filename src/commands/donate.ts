import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
  ActionRowBuilder, StringSelectMenuBuilder, MessageFlags,
} from 'discord.js';
import { PACKAGES, packagesByCategory, findPackage } from '../lib/donations.js';

export const data = new SlashCommandBuilder()
  .setName('donate')
  .setDescription('Pogledaj donatorske pakete i način donacije');

export async function execute(interaction: ChatInputCommandInteraction) {
  const grouped = packagesByCategory();

  const e = new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle('💎  KG Balkan RP — Donacije')
    .setDescription([
      'Tvoja donacija direktno održava server, plaća licence, mape, custom skripte.',
      '**Hvala!** ❤️',
      '',
      '**Načini uplate:** vidi <#1496653485465403482>',
      '**Pravila:** vidi <#1496653487164100798>',
      '',
      'Izaberi kategoriju iz menija ispod da vidiš pakete →',
    ].join('\n'));

  for (const [cat, pkgs] of Object.entries(grouped)) {
    e.addFields({
      name: cat,
      value: pkgs.map(p => `\`${p.price.padEnd(11)}\` **${p.name}**`).join('\n'),
      inline: true,
    });
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId('donate:select')
    .setPlaceholder('Izaberi paket za detalje…')
    .addOptions(
      ...PACKAGES.slice(0, 25).map(p => ({
        label: `${p.name} — ${p.price}`,
        description: p.perks[0]?.slice(0, 100) ?? '',
        value: p.id,
      })),
    );

  await interaction.reply({
    embeds: [e],
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
  });
}
