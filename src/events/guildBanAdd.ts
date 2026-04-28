import { Events, GuildBan, EmbedBuilder, ChannelType, TextChannel } from 'discord.js';
import { stmts } from '../lib/store.js';

export const name = Events.GuildBanAdd;

export async function execute(ban: GuildBan) {
  stmts.addModLog.run(ban.guild.id, ban.user.id, null, 'ban', ban.reason ?? null, 0);

  const channels = await ban.guild.channels.fetch();
  const log = [...channels.values()].find(
    c => c?.type === ChannelType.GuildText && /mod-log|audit|aᴜᴅɪᴛ|ʟᴏɢ/i.test(c.name),
  ) as TextChannel | undefined;
  if (!log) return;

  const e = new EmbedBuilder()
    .setColor(0x000000)
    .setTitle('🔨  Banovan')
    .setAuthor({ name: ban.user.tag, iconURL: ban.user.displayAvatarURL() })
    .addFields(
      { name: 'ID', value: ban.user.id, inline: true },
      { name: 'Razlog', value: ban.reason ?? '_nije naveden_', inline: false },
    )
    .setTimestamp();

  await log.send({ embeds: [e] }).catch(() => {});
}
