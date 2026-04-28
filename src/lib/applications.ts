import {
  ButtonInteraction, ModalSubmitInteraction, EmbedBuilder, ChannelType,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, TextChannel,
} from 'discord.js';
import { stmts } from './store.js';

const APPLY_REVIEW_CHANNEL = /wl.*admin|ʙᴇʟᴀ.*ʟɪꜱᴛᴀ.*ʀᴇᴢᴜʟᴛᴀᴛɪ|ᴡʟ.*ᴀᴅᴍɪɴ.*ᴘʀɪᴊᴀᴠᴇ/i;
const VERIFIED_PLAYER_ROLE = '1496653430729736344';
const CLAN_ROLE = '1496653431769927780';
const ADMIN_ROLE_IDS = [
  '1496653411314172085', // glavni admin
  '1496653412014620845', // admin
  '1496653407786631249', // vlasnik
  '1496653408856314027', // suvlasnik
];

function isAdmin(memberRoleIds: string[]): boolean {
  return memberRoleIds.some(id => ADMIN_ROLE_IDS.includes(id));
}

export async function handleApplicationSubmit(interaction: ModalSubmitInteraction) {
  if (!interaction.guild || !interaction.channel) return;

  const userId = interaction.user.id;
  const guildId = interaction.guildId!;
  const pending = (stmts.pendingApps.get(guildId, userId) as { n: number }).n;
  if (pending > 0) {
    await interaction.reply({ content: 'Već imaš jednu prijavu na čekanju. Sačekaj odluku admina.', flags: MessageFlags.Ephemeral });
    return;
  }

  const realName = interaction.fields.getTextInputValue('ime');
  const age = interaction.fields.getTextInputValue('godine');
  const rpExp = interaction.fields.getTextInputValue('iskustvo');
  const character = interaction.fields.getTextInputValue('lik');
  const whyUs = interaction.fields.getTextInputValue('razlog');

  // Nađi review kanal
  const channels = await interaction.guild.channels.fetch();
  const review = [...channels.values()].find(
    c => c?.type === ChannelType.GuildText && APPLY_REVIEW_CHANNEL.test(c.name),
  ) as TextChannel | undefined;

  if (!review) {
    await interaction.reply({ content: 'Greška: kanal za pregled prijava nije pronađen. Kontaktiraj admina.', flags: MessageFlags.Ephemeral });
    return;
  }

  const result = stmts.createApp.run(guildId, userId, realName, age, rpExp, character, whyUs, null);
  const appId = Number(result.lastInsertRowid);

  const embed = new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle(`📥  Nova prijava #${appId}`)
    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
    .addFields(
      { name: 'Ime (IRL)', value: realName.slice(0, 1024), inline: true },
      { name: 'Godine', value: age.slice(0, 1024), inline: true },
      { name: 'Korisnik', value: `<@${userId}>`, inline: true },
      { name: 'RP iskustvo', value: rpExp.slice(0, 1024), inline: false },
      { name: 'Ideja za lika', value: character.slice(0, 1024), inline: false },
      { name: 'Zašto naš server?', value: whyUs.slice(0, 1024), inline: false },
    )
    .setFooter({ text: `Prijava poslata` })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`apply:approve:${appId}`).setLabel('Odobri').setEmoji('✅').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`apply:reject:${appId}`).setLabel('Odbij').setEmoji('❌').setStyle(ButtonStyle.Danger),
  );

  const sent = await review.send({ embeds: [embed], components: [row] });
  // Ažuriraj message_id
  (await import('./store.js')).db.prepare(`UPDATE applications SET message_id = ? WHERE id = ?`).run(sent.id, appId);

  await interaction.reply({ content: `✅ Prijava **#${appId}** je poslata. Admin tim će je pregledati u 24h.`, flags: MessageFlags.Ephemeral });
}

export async function handleApplicationDecision(interaction: ButtonInteraction, customId: string) {
  if (!interaction.guild || !interaction.member) return;

  const memberRoleIds = (interaction.member.roles as any).cache?.map((r: any) => r.id) ?? [];
  if (!isAdmin(memberRoleIds)) {
    await interaction.reply({ content: 'Samo admini mogu da donose odluke.', flags: MessageFlags.Ephemeral });
    return;
  }

  const [, action, idStr] = customId.split(':');
  const appId = parseInt(idStr, 10);
  const app = stmts.getApp.get(appId) as any;
  if (!app) {
    await interaction.reply({ content: 'Prijava nije pronađena.', flags: MessageFlags.Ephemeral });
    return;
  }
  if (app.status !== 'pending') {
    await interaction.reply({ content: `Već je ${app.status}.`, flags: MessageFlags.Ephemeral });
    return;
  }

  const status = action === 'approve' ? 'approved' : 'rejected';
  stmts.decideApp.run(status, interaction.user.id, appId);

  // Dodeli ulogu ako odobreno
  if (status === 'approved') {
    try {
      const member = await interaction.guild.members.fetch(app.user_id);
      await member.roles.add([VERIFIED_PLAYER_ROLE, CLAN_ROLE]).catch(() => {});
      await member.send({
        content: `🎉 Tvoja prijava **#${appId}** za **KG Balkan RP** je **odobrena**! Connect-uj se i uživaj.`,
      }).catch(() => {});
    } catch {}
  } else {
    try {
      const member = await interaction.guild.members.fetch(app.user_id);
      await member.send({
        content: `❌ Tvoja prijava **#${appId}** za **KG Balkan RP** je **odbijena**. Možeš poslati novu nakon nedelju dana.`,
      }).catch(() => {});
    } catch {}
  }

  // Update embed
  const msg = interaction.message;
  const oldEmbed = msg.embeds[0];
  const updated = EmbedBuilder.from(oldEmbed)
    .setColor(status === 'approved' ? 0x57f287 : 0xed4245)
    .setTitle(oldEmbed.title!.replace(/^\S+/, status === 'approved' ? '✅ ODOBRENO' : '❌ ODBIJENO') + ` #${appId}`)
    .setFooter({ text: `${status === 'approved' ? 'Odobrio' : 'Odbio'}: ${interaction.user.tag}` });

  await msg.edit({ embeds: [updated], components: [] });
  await interaction.reply({ content: `Označeno kao ${status === 'approved' ? 'odobreno' : 'odbijeno'}.`, flags: MessageFlags.Ephemeral });
}
