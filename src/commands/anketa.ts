import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { kgEmbed, STYLE } from '../lib/embedStyle.js';

const EMOJI = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭'];

export const data = new SlashCommandBuilder()
  .setName('anketa')
  .setDescription('Napravi anketu sa do 8 opcija')
  .addStringOption(o => o.setName('pitanje').setDescription('O čemu se glasa').setRequired(true).setMaxLength(200))
  .addStringOption(o => o.setName('opcije').setDescription('Opcije razdvojene znakom |  npr: Da | Ne | Možda').setRequired(true).setMaxLength(800));

export async function execute(interaction: ChatInputCommandInteraction) {
  const question = interaction.options.getString('pitanje', true);
  const optionsRaw = interaction.options.getString('opcije', true);
  const options = optionsRaw.split('|').map(s => s.trim()).filter(Boolean).slice(0, 8);

  if (options.length < 2) {
    await interaction.reply({ content: 'Anketa treba bar 2 opcije razdvojene `|`. Primer: `Da | Ne | Možda`', flags: MessageFlags.Ephemeral });
    return;
  }

  const e = kgEmbed({
    title: question,
    banner: true,
    color: STYLE.primary,
    description: options.map((o, i) => `${EMOJI[i]} **${o}**`).join('\n'),
    author: { name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() },
    footer: 'Glasaj reakcijom ispod',
    guild: interaction.guild,
  });

  const reply = await interaction.reply({ embeds: [e], fetchReply: true });
  for (let i = 0; i < options.length; i++) await reply.react(EMOJI[i]).catch(() => {});
}
