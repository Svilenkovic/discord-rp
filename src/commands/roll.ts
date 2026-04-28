import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { parseDice, rollDice } from '../lib/dice.js';
import { kgEmbed, STYLE, field } from '../lib/embedStyle.js';

export const data = new SlashCommandBuilder()
  .setName('roll')
  .setDescription('Baci kockice. Sintaksa: NdM[+K] (npr. 2d20+3)')
  .addStringOption(opt =>
    opt.setName('expr').setDescription('Izraz: 1d20, 2d6+3, 4d8-1...').setRequired(true),
  )
  .addStringOption(opt =>
    opt.setName('reason').setDescription('Razlog (opciono): npr. attack, save').setRequired(false),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const expr = interaction.options.getString('expr', true);
  const reason = interaction.options.getString('reason') ?? null;

  const parsed = parseDice(expr);
  if (!parsed) {
    await interaction.reply({ content: `Nevalidan izraz: \`${expr}\`. Probaj npr. \`2d20+3\`.`, flags: MessageFlags.Ephemeral });
    return;
  }
  const { count, sides, modifier } = parsed;
  if (count < 1 || count > 100 || sides < 2 || sides > 1000) {
    await interaction.reply({ content: 'Limit: 1-100 kockica, strane 2-1000.', flags: MessageFlags.Ephemeral });
    return;
  }

  const rolls = rollDice(count, sides);
  const sum = rolls.reduce((a, b) => a + b, 0);
  const total = sum + modifier;
  const modStr = modifier === 0 ? '' : modifier > 0 ? ` + ${modifier}` : ` − ${Math.abs(modifier)}`;
  const rollsStr = rolls.length <= 20 ? rolls.join(', ') : `${rolls.slice(0, 20).join(', ')}, ...`;

  const e = kgEmbed({
    title: `🎲  ${expr.toLowerCase()}${reason ? ` — ${reason}` : ''}`,
    color: STYLE.primary,
    author: { name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() },
    description: `# ${total}`,
    fields: [
      field('Kockice', `[${rollsStr}]`),
      field('Suma', `${sum}${modStr} = **${total}**`),
    ],
    guild: interaction.guild,
  });
  await interaction.reply({ embeds: [e] });
}
