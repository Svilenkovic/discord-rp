import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { getStatus } from '../lib/fivem.js';
import { kgEmbed, STYLE, progressBar, field } from '../lib/embedStyle.js';

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Stanje FiveM servera (online igrači, queue, resursi)');

export async function execute(interaction: ChatInputCommandInteraction) {
  const ip = process.env.FIVEM_SERVER_IP;
  if (!ip) {
    await interaction.reply({
      content: '⚠️ `FIVEM_SERVER_IP` nije postavljen u `.env`. Admin treba da ga doda u formatu `IP:PORT`.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deferReply();
  const s = await getStatus(ip);

  if (!s.online) {
    const e = kgEmbed({
      title: '🔴  Server je offline',
      description: `Nije moguće dobiti odgovor od \`${ip}\`.`,
      color: STYLE.danger,
      guild: interaction.guild,
    });
    await interaction.editReply({ embeds: [e] });
    return;
  }

  const pct = (s.players ?? 0) / (s.maxPlayers ?? 1);
  const e = kgEmbed({
    title: `🟢  ${s.hostname ?? 'KG Balkan RP'}`,
    banner: true,
    color: STYLE.success,
    description: [
      `**Igrača:** ${s.players}/${s.maxPlayers}${s.queue ? ` _(queue: ${s.queue})_` : ''}`,
      `\`${progressBar(pct)}\``,
      ``,
      `**Connect:** F8 → \`connect ${ip}\``,
    ].join('\n'),
    fields: [
      field('Resursi', `${s.resources}`, true),
      ...(s.gametype ? [field('Gametype', s.gametype, true)] : []),
      ...(s.mapname ? [field('Mapa', s.mapname, true)] : []),
    ],
    footer: `IP: ${ip}`,
    guild: interaction.guild,
  });
  await interaction.editReply({ embeds: [e] });
}
