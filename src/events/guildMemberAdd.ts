import { Events, GuildMember, EmbedBuilder, AuditLogEvent, TextChannel, ChannelType } from 'discord.js';
import { stmts } from '../lib/store.js';

export const name = Events.GuildMemberAdd;

const MIN_ACCOUNT_AGE_DAYS = 7;

export async function execute(member: GuildMember) {
  const accountAgeDays = (Date.now() - member.user.createdTimestamp) / (24 * 3600 * 1000);

  // Anti-raid: kick novih account-a (bez ban-a, samo kick)
  if (accountAgeDays < MIN_ACCOUNT_AGE_DAYS) {
    try {
      await member.send({
        content: `Tvoj Discord nalog je mlađi od ${MIN_ACCOUNT_AGE_DAYS} dana, što je naša anti-raid mera. Pokušaj kasnije.`,
      }).catch(() => {});
      await member.kick(`anti-raid: account < ${MIN_ACCOUNT_AGE_DAYS}d`);
      stmts.addModLog.run(member.guild.id, member.id, member.client.user!.id, 'auto-kick', `account_age=${accountAgeDays.toFixed(1)}d`, 0);

      // Log
      await logToModChannel(member.guild, new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('🛡️  Anti-raid kick')
        .setDescription(`<@${member.id}> (\`${member.user.tag}\`) — nalog star ${accountAgeDays.toFixed(1)} dana.`)
        .setTimestamp());
      return;
    } catch {}
  }

  // Welcome DM novom članu
  try {
    const e = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('Dobrodošao na KG Balkan RP!')
      .setDescription([
        'Hvala što si nam se pridružio. Da bi mogao da igraš, prati 4 koraka:',
        '',
        '`①` Pročitaj **Pravila servera** u <#1496653451604529425>',
        '`②` Verifikuj se u <#1496653445665390724>',
        '`③` Izaberi svoje uloge u <#1496653448265863320>',
        '`④` Predaj prijavu za belu listu — komanda `/apply` ili u <#1496653473507184680>',
        '',
        'Vidimo se u igri! 🎮',
      ].join('\n'))
      .setThumbnail(member.guild.iconURL({ size: 256 }) ?? null);
    await member.send({ embeds: [e] });
  } catch {}

  // Log join
  await logToModChannel(member.guild, new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('✅  Pridružio se')
    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
    .addFields(
      { name: 'ID', value: member.id, inline: true },
      { name: 'Account star', value: `${accountAgeDays.toFixed(1)} d`, inline: true },
      { name: 'Total members', value: `${member.guild.memberCount}`, inline: true },
    )
    .setTimestamp());
}

async function logToModChannel(guild: GuildMember['guild'], embed: EmbedBuilder) {
  const channels = await guild.channels.fetch();
  const log = [...channels.values()].find(
    c => c?.type === ChannelType.GuildText && /mod-log|audit|aᴜᴅɪᴛ|ʟᴏɢ/i.test(c.name),
  ) as TextChannel | undefined;
  if (log) await log.send({ embeds: [embed] }).catch(() => {});
}
