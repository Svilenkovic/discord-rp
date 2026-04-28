import {
  SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits,
  TextChannel, MessageFlags,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('clear')
  .setDescription('[MOD] Obriši poslednjih N poruka iz ovog kanala (1-100)')
  .addIntegerOption(o =>
    o.setName('broj').setDescription('1-100').setRequired(true).setMinValue(1).setMaxValue(100),
  )
  .addUserOption(o =>
    o.setName('korisnik').setDescription('Samo poruke ovog korisnika (opciono)').setRequired(false),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction) {
  const n = interaction.options.getInteger('broj', true);
  const user = interaction.options.getUser('korisnik');
  const ch = interaction.channel as TextChannel;
  if (!ch || !('bulkDelete' in ch)) {
    await interaction.reply({ content: 'Komanda ne radi u ovom tipu kanala.', flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  let msgs = await ch.messages.fetch({ limit: 100 });
  if (user) msgs = msgs.filter(m => m.author.id === user.id);
  const slice = [...msgs.values()].slice(0, n);
  if (slice.length === 0) {
    await interaction.editReply('Nema poruka za brisanje.');
    return;
  }

  const young = slice.filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 3600 * 1000);
  const old = slice.filter(m => Date.now() - m.createdTimestamp >= 14 * 24 * 3600 * 1000);
  let deleted = 0;
  if (young.length > 1) {
    const r = await ch.bulkDelete(young, true).catch(() => null);
    deleted += r?.size ?? 0;
  } else if (young.length === 1) {
    try { await young[0].delete(); deleted++; } catch {}
  }
  for (const m of old) {
    try { await m.delete(); deleted++; await new Promise(r => setTimeout(r, 400)); } catch {}
  }

  await interaction.editReply(`🧹 Obrisano ${deleted} poruka${user ? ` od <@${user.id}>` : ''}.`);
}
