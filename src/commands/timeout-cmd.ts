import {
  SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, MessageFlags,
} from 'discord.js';
import { stmts } from '../lib/store.js';

export const data = new SlashCommandBuilder()
  .setName('timeout')
  .setDescription('[MOD] Privremeno utišaj korisnika')
  .addUserOption(o => o.setName('korisnik').setDescription('Koga utišati').setRequired(true))
  .addIntegerOption(o => o.setName('minuta').setDescription('1-10080 (max 7 dana)').setRequired(true).setMinValue(1).setMaxValue(10080))
  .addStringOption(o => o.setName('razlog').setDescription('Zašto').setRequired(false).setMaxLength(200))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .setDMPermission(false);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return;
  const user = interaction.options.getUser('korisnik', true);
  const minutes = interaction.options.getInteger('minuta', true);
  const reason = interaction.options.getString('razlog') ?? 'Bez razloga';
  const ms = minutes * 60 * 1000;

  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) {
    await interaction.reply({ content: 'Korisnik nije na ovom serveru.', flags: MessageFlags.Ephemeral });
    return;
  }

  try {
    await member.timeout(ms, `${reason} — ${interaction.user.tag}`);
    stmts.addModLog.run(interaction.guildId!, user.id, interaction.user.id, 'timeout', reason, minutes * 60);
    await interaction.reply({ content: `🔇 <@${user.id}> utišan na ${minutes} min. Razlog: ${reason}` });
  } catch (e: any) {
    await interaction.reply({ content: `Greška: ${e?.message ?? 'nepoznato'}.`, flags: MessageFlags.Ephemeral });
  }
}
