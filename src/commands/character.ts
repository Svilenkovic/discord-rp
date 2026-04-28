import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { stmts } from '../lib/store.js';
import { kgEmbed, STYLE, field } from '../lib/embedStyle.js';

export const data = new SlashCommandBuilder()
  .setName('character')
  .setDescription('Upravljaj svojim RP karakterom.')
  .addSubcommand(sub =>
    sub.setName('create').setDescription('Kreiraj novi karakter.')
      .addStringOption(o => o.setName('name').setDescription('Ime').setRequired(true))
      .addStringOption(o => o.setName('class').setDescription('Klasa (npr. fighter, mage)').setRequired(false)),
  )
  .addSubcommand(sub =>
    sub.setName('view').setDescription('Pogledaj karakter.')
      .addUserOption(o => o.setName('user').setDescription('Tuđi karakter (opciono)').setRequired(false)),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Komanda radi samo unutar servera.', flags: MessageFlags.Ephemeral });
    return;
  }
  const sub = interaction.options.getSubcommand();

  if (sub === 'create') {
    const name = interaction.options.getString('name', true);
    const klass = interaction.options.getString('class') ?? 'commoner';
    try {
      stmts.createChar.run(interaction.user.id, interaction.guildId, name, klass);
      await interaction.reply({
        content: `Karakter **${name}** (${klass}) kreiran. Vidi ga sa \`/character view\`.`,
      });
    } catch (e: any) {
      if (String(e?.code).includes('SQLITE_CONSTRAINT')) {
        await interaction.reply({ content: 'Već imaš karakter na ovom serveru.', flags: MessageFlags.Ephemeral });
      } else {
        throw e;
      }
    }
    return;
  }

  if (sub === 'view') {
    const user = interaction.options.getUser('user') ?? interaction.user;
    const row = stmts.getChar.get(user.id, interaction.guildId) as
      | { name: string; class: string; level: number; created_at: number } | undefined;
    if (!row) {
      await interaction.reply({
        content: `${user.id === interaction.user.id ? 'Nemaš' : `${user.username} nema`} karakter na ovom serveru.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const e = kgEmbed({
      title: row.name,
      banner: true,
      color: STYLE.success,
      author: { name: user.tag, iconURL: user.displayAvatarURL() },
      thumbnail: user.displayAvatarURL({ size: 256 }),
      fields: [
        field('Klasa', row.class, true),
        field('Level', `${row.level}`, true),
        field('Vlasnik', `<@${user.id}>`, true),
      ],
      footer: `Kreiran ${new Date(row.created_at * 1000).toLocaleDateString('sr-RS')}`,
      guild: interaction.guild,
    });
    await interaction.reply({ embeds: [e] });
    return;
  }
}
