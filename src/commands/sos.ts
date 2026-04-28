import {
  SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, TextChannel,
  EmbedBuilder, MessageFlags,
} from 'discord.js';

const SOS_REGEX = /pomoc|pomoć|sos/i;
const SUPPORT_ROLE = '1496653419811704832';

export const data = new SlashCommandBuilder()
  .setName('sos')
  .setDescription('Hitno pozovi tim podrške u prvi slobodan SOS kanal')
  .addStringOption(o =>
    o.setName('problem').setDescription('Šta se desilo?').setRequired(true).setMaxLength(300),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return;
  const problem = interaction.options.getString('problem', true);

  const channels = await interaction.guild.channels.fetch();
  const sosChannels = [...channels.values()]
    .filter(c => c?.type === ChannelType.GuildText && SOS_REGEX.test(c.name))
    .sort((a, b) => (a as any).name.localeCompare((b as any).name)) as TextChannel[];

  if (sosChannels.length === 0) {
    await interaction.reply({ content: 'SOS kanali još nisu postavljeni. Otvori `/ticket` umesto toga.', flags: MessageFlags.Ephemeral });
    return;
  }

  // Nadji prvi gde nema "u toku" markera
  // (jednostavno: koristi prvi)
  const target = sosChannels[0];

  const e = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('🆘  SOS poziv')
    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
    .setDescription(problem)
    .setFooter({ text: 'Tim podrške je upozoren' })
    .setTimestamp();

  await target.send({ content: `<@&${SUPPORT_ROLE}> SOS od <@${interaction.user.id}>`, embeds: [e] });
  await interaction.reply({
    content: `✅ Tim podrške je obavešten u <#${target.id}>. Idi tamo i nastavi razgovor.`,
    flags: MessageFlags.Ephemeral,
  });
}
