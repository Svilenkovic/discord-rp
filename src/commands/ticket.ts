import {
  SlashCommandBuilder, ChatInputCommandInteraction, ChannelType,
  PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
} from 'discord.js';
import { stmts } from '../lib/store.js';

const SUPPORT_ROLE = '1496653419811704832'; // Tim podrške

export const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('Otvori privatan tiket za podršku')
  .addStringOption(o =>
    o.setName('razlog').setDescription('Kratak opis problema').setRequired(true).setMaxLength(120),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return;

  const userId = interaction.user.id;
  const guildId = interaction.guildId!;
  const open = (stmts.userOpenTickets.get(guildId, userId) as { n: number }).n;
  if (open >= 3) {
    await interaction.reply({ content: 'Imaš već 3 otvorena tiketa. Zatvori jedan pre nego što otvoriš nov.', flags: MessageFlags.Ephemeral });
    return;
  }

  const reason = interaction.options.getString('razlog', true);

  // Naziv kanala: ticket-<username>-<rand>
  const userName = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user';
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  const channelName = `ticket-${userName}-${rand}`;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const channel = await interaction.guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    topic: `Tiket: ${interaction.user.tag} — ${reason}`,
    permissionOverwrites: [
      { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory] },
      { id: SUPPORT_ROLE, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory] },
      { id: interaction.client.user!.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
    ],
  });

  stmts.createTicket.run(channel.id, guildId, userId, reason);

  const e = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`🎫  Tiket otvoren`)
    .setDescription(`Hej <@${userId}>, opisao si:\n> ${reason}\n\nTim podrške <@&${SUPPORT_ROLE}> će ti odgovoriti uskoro.`)
    .setFooter({ text: `Klikni "Zatvori" kad rešiš problem.` });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('ticket:close').setLabel('Zatvori tiket').setEmoji('🔒').setStyle(ButtonStyle.Danger),
  );

  await channel.send({ content: `<@${userId}> <@&${SUPPORT_ROLE}>`, embeds: [e], components: [row] });
  await interaction.editReply({ content: `✅ Tvoj tiket: <#${channel.id}>` });
}
