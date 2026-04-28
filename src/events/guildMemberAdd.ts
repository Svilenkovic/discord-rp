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

  // Auto-role: dodeli "Neverifikovan" rolu odmah (default pristup pre verifikacije)
  try {
    await member.roles.add('1496653432847732787').catch(() => {});
  } catch {}

  // Welcome DM novom članu
  try {
    const { kgEmbed, STYLE, steps } = await import('../lib/embedStyle.js');
    const e = kgEmbed({
      title: 'Dobrodošao na KG Balkan RP',
      banner: true,
      color: STYLE.primary,
      description: 'Hvala što si nam se pridružio. Da bi počeo da igraš, prati 4 koraka:',
      fields: [{ name: '​', value: steps([
        ['Pravila servera', '<#1496653451604529425>'],
        ['Verifikacija', '<#1496653445665390724>'],
        ['Izbor uloga', '<#1496653448265863320>'],
        ['White lista prijava', '`/apply` ili <#1496653473507184680>'],
      ]) }],
      footer: 'Vidimo se u igri',
      guild: member.guild,
    });
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
