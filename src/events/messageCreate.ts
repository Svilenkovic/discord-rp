import { Events, Message, EmbedBuilder, ChannelType, TextChannel } from 'discord.js';
import { evaluateMessage } from '../lib/automod.js';
import { stmts } from '../lib/store.js';
import { awardMessageXp } from '../lib/levels.js';

export const name = Events.MessageCreate;

const ADMIN_ROLE_IDS = new Set([
  '1496653411314172085', '1496653412014620845',
  '1496653407786631249', '1496653408856314027',
  '1496653417697902662', '1496653413772038225',
  '1496653410185908386',
]);

export async function execute(message: Message) {
  if (message.author.bot) return;
  if (!message.guild) return;

  const memberRoles = message.member?.roles?.cache;
  const isAdmin = memberRoles && [...memberRoles.keys()].some(id => ADMIN_ROLE_IDS.has(id));

  // ── Automod (skip za admine) ──
  if (!isAdmin) {
    const verdict = evaluateMessage(message.author.id, message.content);
    if (verdict.action !== 'none') {
      stmts.addModLog.run(
        message.guild.id, message.author.id, message.client.user!.id,
        `automod-${verdict.action}`, verdict.reason ?? null,
        Math.floor((verdict.timeoutMs ?? 0) / 1000),
      );

      if (verdict.action === 'delete' || verdict.action === 'timeout') {
        try { await message.delete(); } catch {}
      }
      if (verdict.action === 'timeout' && verdict.timeoutMs) {
        try { await message.member?.timeout(verdict.timeoutMs, `automod: ${verdict.reason}`); } catch {}
      }

      const warn = await message.channel.send({
        content: `<@${message.author.id}> ${verdict.reason ?? 'Pravilo prekršeno'}.`,
      }).catch(() => null);
      if (warn) setTimeout(() => warn.delete().catch(() => {}), 8000);

      const channels = await message.guild.channels.fetch();
      const log = [...channels.values()].find(
        c => c?.type === ChannelType.GuildText && /mod-log|audit|aᴜᴅɪᴛ|ʟᴏɢ/i.test(c.name),
      ) as TextChannel | undefined;
      if (log) {
        const e = new EmbedBuilder()
          .setColor(verdict.action === 'timeout' ? 0xed4245 : 0xfee75c)
          .setTitle(`🤖  Automod: ${verdict.action}`)
          .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
          .addFields(
            { name: 'Razlog', value: verdict.reason ?? '?', inline: false },
            { name: 'Kanal', value: `<#${message.channelId}>`, inline: true },
            { name: 'Sadržaj', value: message.content.slice(0, 1024) || '_(prazno)_', inline: false },
          )
          .setTimestamp();
        await log.send({ embeds: [e] }).catch(() => {});
      }
      return; // ne dajemo XP za automod-flagged poruke
    }
  }

  // ── XP za messaging activity ──
  if (message.content.length >= 5) {
    const award = awardMessageXp(message.guild.id, message.author.id);
    if (award && award.newLevel > award.oldLevel) {
      // Level up obaveštenje
      await message.channel.send({
        content: `🎉 <@${message.author.id}> dostigao **Level ${award.newLevel}**!`,
      }).catch(() => {});
    }
  }
}
