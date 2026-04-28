import { Events, GuildMember, PartialGuildMember, EmbedBuilder, ChannelType, TextChannel } from 'discord.js';

export const name = Events.GuildMemberRemove;

export async function execute(member: GuildMember | PartialGuildMember) {
  const channels = await member.guild.channels.fetch();
  const log = [...channels.values()].find(
    c => c?.type === ChannelType.GuildText && /mod-log|audit|aᴜᴅɪᴛ|ʟᴏɢ/i.test(c.name),
  ) as TextChannel | undefined;
  if (!log) return;

  const e = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('❌  Otišao')
    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
    .addFields(
      { name: 'ID', value: member.id, inline: true },
      { name: 'Total members', value: `${member.guild.memberCount}`, inline: true },
    )
    .setTimestamp();

  await log.send({ embeds: [e] }).catch(() => {});
}
