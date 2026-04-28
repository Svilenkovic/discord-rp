import {
  ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle,
  ActionRowBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ButtonStyle,
  CategoryChannel, MessageFlags, ModalSubmitInteraction,
} from 'discord.js';
import { stmts } from './store.js';

export interface TicketCategory {
  id: string;
  label: string;
  emoji: string;
  color: number;
  reviewerRoleId: string;
}

const SUPPORT       = '1496653419811704832';
const ADMIN         = '1496653411314172085';
const VLASNIK       = '1496653407786631249';
const SUVLASNIK     = '1496653408856314027';
const DONATION_TEAM = '1496653425352376330';
const WL_TEAM       = '1496653421422448662';
const DEV_ROLE      = '1496653410185908386';
const MEDIA_TEAM    = '1496653424127639683';
const EVENT_TEAM    = '1496653422554910844';

export const TICKET_CATEGORIES: Record<string, TicketCategory> = {
  // Opšti tiketi
  pomoc:    { id: 'pomoc',    label: 'Pomoć',          emoji: '🆘', color: 0x5865f2, reviewerRoleId: SUPPORT },
  zalba:    { id: 'zalba',    label: 'Žalba',          emoji: '⚖️', color: 0xed4245, reviewerRoleId: ADMIN },
  bug:      { id: 'bug',      label: 'Bug',            emoji: '🐛', color: 0xfee75c, reviewerRoleId: DEV_ROLE },
  donacija: { id: 'donacija', label: 'Donacija',       emoji: '💎', color: 0xfee75c, reviewerRoleId: DONATION_TEAM },
  wl:       { id: 'wl',       label: 'White lista',    emoji: '📝', color: 0x57f287, reviewerRoleId: WL_TEAM },
  ostalo:   { id: 'ostalo',   label: 'Saradnja',       emoji: '🤝', color: 0x95a5a6, reviewerRoleId: SUPPORT },

  // Prijave (posebna kategorija)
  'p-admin':    { id: 'p-admin',    label: 'Admin prijava',          emoji: '🛡️', color: 0xc0392b, reviewerRoleId: VLASNIK },
  'p-wladmin':  { id: 'p-wladmin',  label: 'WL Admin prijava',       emoji: '📥', color: 0x57f287, reviewerRoleId: ADMIN },
  'p-promoter': { id: 'p-promoter', label: 'Promoter prijava',       emoji: '🎟️', color: 0xfee75c, reviewerRoleId: SUPPORT },
  'p-strimer':  { id: 'p-strimer',  label: 'Strimer prijava',        emoji: '📺', color: 0xe84393, reviewerRoleId: MEDIA_TEAM },
  'p-beta':     { id: 'p-beta',     label: 'Beta tester prijava',    emoji: '🧪', color: 0x00b894, reviewerRoleId: DEV_ROLE },
  'p-pd':       { id: 'p-pd',       label: 'PD načelnik prijava',    emoji: '🚔', color: 0x2980b9, reviewerRoleId: VLASNIK },
  'p-bolnica':  { id: 'p-bolnica',  label: 'Bolnica direktor prijava', emoji: '🏥', color: 0xed4245, reviewerRoleId: VLASNIK },
  'p-event':    { id: 'p-event',    label: 'Event tim prijava',      emoji: '🎪', color: 0x2ecc71, reviewerRoleId: EVENT_TEAM },
  'p-mafija':   { id: 'p-mafija',   label: 'Mafija/Kartel lider',    emoji: '🏴', color: 0x8e44ad, reviewerRoleId: SUVLASNIK },
};

export async function openTicketModal(interaction: ButtonInteraction, catId: string) {
  const cat = TICKET_CATEGORIES[catId];
  if (!cat) {
    await interaction.reply({ content: 'Nepoznata kategorija.', flags: MessageFlags.Ephemeral });
    return;
  }
  const modal = new ModalBuilder()
    .setCustomId(`tnew:${catId}`)
    .setTitle(`${cat.emoji} ${cat.label} — novi ticket`);
  const naslov = new TextInputBuilder().setCustomId('naslov').setLabel('Kratak naslov').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(80);
  const opis = new TextInputBuilder().setCustomId('opis').setLabel('Detalji (šta, kada, gde)').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(1500);
  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(naslov),
    new ActionRowBuilder<TextInputBuilder>().addComponents(opis),
  );
  await interaction.showModal(modal);
}

export async function createTicketFromModal(interaction: ModalSubmitInteraction, catId: string) {
  if (!interaction.guild) return;
  const cat = TICKET_CATEGORIES[catId];
  if (!cat) return;

  const userId = interaction.user.id;
  const guildId = interaction.guildId!;
  const open = (stmts.userOpenTickets.get(guildId, userId) as { n: number }).n;
  if (open >= 3) {
    await interaction.reply({ content: 'Imaš već 3 otvorena ticketa. Zatvori jedan pre nego što otvoriš nov.', flags: MessageFlags.Ephemeral });
    return;
  }

  const naslov = interaction.fields.getTextInputValue('naslov');
  const opis = interaction.fields.getTextInputValue('opis');

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  // Nadji ticket parent (kategorija u Discord-u)
  const channels = await interaction.guild.channels.fetch();
  const ticketCat = [...channels.values()].find(
    ch => ch?.type === ChannelType.GuildCategory && /ticket|tikket|ᴛɪᴄᴋᴇᴛ/i.test(ch.name),
  ) as CategoryChannel | undefined;

  const userName = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user';
  const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  const channelName = `${cat.emoji}︱${cat.id}-${userName}-${rand}`;

  const channel = await interaction.guild.channels.create({
    name: channelName.slice(0, 95),
    type: ChannelType.GuildText,
    parent: ticketCat?.id,
    topic: `${cat.label} — ${interaction.user.tag} — ${naslov}`,
    permissionOverwrites: [
      { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory] },
      { id: cat.reviewerRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory] },
      { id: SUPPORT, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }, // support uvek vidi sve
      { id: interaction.client.user!.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
    ],
  });

  stmts.createTicket.run(channel.id, guildId, userId, `${cat.label}: ${naslov}`);

  const e = new EmbedBuilder()
    .setColor(cat.color)
    .setTitle(`${cat.emoji}  ${cat.label} — ${naslov}`)
    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
    .setDescription(opis)
    .setFooter({ text: `Ticket ID: ${channel.id}` })
    .setTimestamp();

  const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('ticket:close').setLabel('Zatvori ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger),
  );

  await channel.send({
    content: `<@${userId}> <@&${cat.reviewerRoleId}>`,
    embeds: [e],
    components: [closeRow],
  });
  await interaction.editReply({ content: `✅ Tvoj ticket je otvoren: <#${channel.id}>` });
}
