import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { getStatus } from '../lib/fivem.js';

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Prikaži stanje FiveM servera (online igrači, queue, resursi)');

export async function execute(interaction: ChatInputCommandInteraction) {
  const ip = process.env.FIVEM_SERVER_IP;
  if (!ip) {
    await interaction.reply({
      content: '⚠️ `FIVEM_SERVER_IP` nije postavljen u `.env` botu. Admin treba da ga doda u formatu `IP:PORT` (npr. `1.2.3.4:30120`).',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply();
  const s = await getStatus(ip);

  if (!s.online) {
    const e = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('🔴  Server je offline')
      .setDescription(`Nije moguće dobiti odgovor od \`${ip}\`.`)
      .setTimestamp();
    await interaction.editReply({ embeds: [e] });
    return;
  }

  const filled = Math.round(((s.players ?? 0) / (s.maxPlayers ?? 1)) * 20);
  const bar = '█'.repeat(Math.min(20, filled)) + '░'.repeat(20 - Math.min(20, filled));

  const e = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(`🟢  ${s.hostname ?? 'FiveM Server'}`)
    .setDescription([
      `**Igrača:** ${s.players}/${s.maxPlayers} ${s.queue ? ` _(queue: ${s.queue})_` : ''}`,
      `\`${bar}\``,
      ``,
      `**Resursi:** ${s.resources}`,
      s.gametype ? `**Gametype:** ${s.gametype}` : '',
      s.mapname ? `**Mapa:** ${s.mapname}` : '',
    ].filter(Boolean).join('\n'))
    .setFooter({ text: `IP: ${ip}` })
    .setTimestamp();

  await interaction.editReply({ embeds: [e] });
}
