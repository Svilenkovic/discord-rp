import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { stmts } from '../lib/store.js';

export const data = new SlashCommandBuilder()
  .setName('character')
  .setDescription('Upravljaj svojim RP karakterom.')
  .addSubcommand(sub =>
    sub
      .setName('create')
      .setDescription('Kreiraj novi karakter.')
      .addStringOption(o => o.setName('name').setDescription('Ime').setRequired(true))
      .addStringOption(o => o.setName('class').setDescription('Klasa (npr. fighter, mage)').setRequired(false)),
  )
  .addSubcommand(sub =>
    sub
      .setName('view')
      .setDescription('Pogledaj karakter.')
      .addUserOption(o => o.setName('user').setDescription('Tuđi karakter (opciono)').setRequired(false)),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Komanda radi samo unutar servera.', ephemeral: true });
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
        await interaction.reply({ content: 'Već imaš karakter na ovom serveru. Brisanje nije još implementirano.', ephemeral: true });
      } else {
        throw e;
      }
    }
    return;
  }

  if (sub === 'view') {
    const user = interaction.options.getUser('user') ?? interaction.user;
    const row = stmts.getChar.get(user.id, interaction.guildId) as
      | { name: string; class: string; level: number; created_at: number }
      | undefined;
    if (!row) {
      await interaction.reply({
        content: `${user.username === interaction.user.username ? 'Nemaš' : `${user.username} nema`} karakter na ovom serveru.`,
        ephemeral: true,
      });
      return;
    }
    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle(`${row.name}`)
      .addFields(
        { name: 'Klasa', value: row.class, inline: true },
        { name: 'Level', value: String(row.level), inline: true },
        { name: 'Vlasnik', value: `<@${user.id}>`, inline: true },
      )
      .setFooter({ text: `Kreiran ${new Date(row.created_at * 1000).toLocaleDateString('sr-RS')}` });
    await interaction.reply({ embeds: [embed] });
    return;
  }
}
