import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, ChannelType, TextChannel,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('predlog')
  .setDescription('Pošalji predlog (auto-šalje u predlozi kanal sa upvote/downvote)')
  .addStringOption(o => o.setName('naslov').setDescription('Kratak naslov').setRequired(true).setMaxLength(100))
  .addStringOption(o => o.setName('opis').setDescription('Detalji predloga').setRequired(true).setMaxLength(1500));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return;
  const naslov = interaction.options.getString('naslov', true);
  const opis = interaction.options.getString('opis', true);

  const channels = await interaction.guild.channels.fetch();
  const predloziCh = [...channels.values()].find(
    c => c?.type === ChannelType.GuildText && /predlozi|ᴘʀᴇᴅʟᴏᴢɪ/i.test(c.name),
  ) as TextChannel | undefined;

  if (!predloziCh) {
    await interaction.reply({ content: 'Kanal za predloge nije pronađen. Kontaktiraj admina.', flags: MessageFlags.Ephemeral });
    return;
  }

  const e = new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle(`💡  ${naslov}`)
    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
    .setDescription(opis)
    .setFooter({ text: 'Glasaj 👍 / 👎' })
    .setTimestamp();

  const sent = await predloziCh.send({ embeds: [e] });
  await sent.react('👍');
  await sent.react('👎');
  // Thread za diskusiju
  await sent.startThread({ name: `Diskusija: ${naslov.slice(0, 80)}`, autoArchiveDuration: 1440 }).catch(() => {});

  await interaction.reply({ content: `✅ Predlog poslat u <#${predloziCh.id}>`, flags: MessageFlags.Ephemeral });
}
