import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, PermissionFlagsBits,
} from 'discord.js';
import { db, stmts } from '../lib/store.js';

const WARN_THRESHOLDS = [
  { count: 3, action: 'timeout', minutes: 60 },
  { count: 5, action: 'timeout', minutes: 24 * 60 },
  { count: 7, action: 'kick' },
];

export const data = new SlashCommandBuilder()
  .setName('warn')
  .setDescription('[MOD] Daj upozorenje korisniku (3 = 1h timeout, 5 = 24h, 7 = kick)')
  .addUserOption(o => o.setName('korisnik').setDescription('Koga upozoravaš').setRequired(true))
  .addStringOption(o => o.setName('razlog').setDescription('Razlog upozorenja').setRequired(true).setMaxLength(300))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return;
  const target = interaction.options.getUser('korisnik', true);
  const reason = interaction.options.getString('razlog', true);

  if (target.bot) {
    await interaction.reply({ content: 'Botovi se ne upozoravaju.', flags: MessageFlags.Ephemeral });
    return;
  }
  if (target.id === interaction.user.id) {
    await interaction.reply({ content: 'Ne možeš sam sebe da upozoravaš.', flags: MessageFlags.Ephemeral });
    return;
  }

  db.prepare(`INSERT INTO warnings (guild_id, user_id, actor_id, reason) VALUES (?, ?, ?, ?)`)
    .run(interaction.guildId!, target.id, interaction.user.id, reason);

  const total = (db.prepare(`SELECT COUNT(*) AS n FROM warnings WHERE guild_id = ? AND user_id = ?`)
    .get(interaction.guildId!, target.id) as any).n;

  // Threshold akcija
  const hit = WARN_THRESHOLDS.find(t => t.count === total);
  let actionTxt = '';
  if (hit) {
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (member) {
      try {
        if (hit.action === 'timeout' && hit.minutes) {
          await member.timeout(hit.minutes * 60 * 1000, `auto: ${total} warninga`);
          actionTxt = ` → automatski **timeout ${hit.minutes >= 60 ? Math.floor(hit.minutes/60)+'h' : hit.minutes+'min'}**`;
        } else if (hit.action === 'kick') {
          await member.kick(`auto: ${total} warninga`);
          actionTxt = ' → automatski **kick**';
        }
        stmts.addModLog.run(interaction.guildId!, target.id, interaction.client.user!.id,
          `auto-${hit.action}`, `${total} warninga`, (hit.minutes ?? 0) * 60);
      } catch {}
    }
  }

  // DM target-u
  await target.send({
    content: `⚠️ Dobio si **upozorenje** na **KG Balkan RP** Discord-u.\n**Razlog:** ${reason}\n**Ukupno warninga:** ${total}${actionTxt}`,
  }).catch(() => {});

  const embed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle(`⚠️ Upozorenje #${total}`)
    .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
    .addFields(
      { name: 'Razlog', value: reason, inline: false },
      { name: 'Daje', value: `<@${interaction.user.id}>`, inline: true },
      { name: 'Ukupno', value: `**${total}**`, inline: true },
    )
    .setFooter({ text: actionTxt ? `Akcija: ${actionTxt.replace(/[*→ ]/g, ' ').trim()}` : 'Sledeći threshold: 3=timeout 1h, 5=timeout 24h, 7=kick' })
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
}
