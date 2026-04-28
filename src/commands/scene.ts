import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { stmts } from '../lib/store.js';
import { kgEmbed, STYLE, field } from '../lib/embedStyle.js';

export const data = new SlashCommandBuilder()
  .setName('scene')
  .setDescription('Vodi RP scenu na ovom serveru.')
  .addSubcommand(s =>
    s.setName('start').setDescription('Započni novu scenu.')
      .addStringOption(o => o.setName('location').setDescription('Mesto').setRequired(true))
      .addStringOption(o => o.setName('description').setDescription('Atmosfera/opis').setRequired(false)),
  )
  .addSubcommand(s => s.setName('end').setDescription('Završi trenutnu scenu (briše log).'))
  .addSubcommand(s =>
    s.setName('log').setDescription('Dodaj zapis u scenu.')
      .addStringOption(o => o.setName('text').setDescription('Šta se dešava').setRequired(true)),
  )
  .addSubcommand(s =>
    s.setName('info').setDescription('Prikaži trenutnu scenu i poslednje zapise.')
      .addIntegerOption(o => o.setName('limit').setDescription('Broj zapisa (default 5, max 20)').setRequired(false)),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Komanda radi samo unutar servera.', flags: MessageFlags.Ephemeral });
    return;
  }
  const sub = interaction.options.getSubcommand();
  const gid = interaction.guildId;

  if (sub === 'start') {
    const location = interaction.options.getString('location', true);
    const description = interaction.options.getString('description');
    stmts.startScene.run(gid, location, description, interaction.user.id);
    stmts.endSceneLog.run(gid);
    const e = kgEmbed({
      title: `🎬 Scena započeta: ${location}`,
      color: STYLE.brand,
      description: description ?? '_bez opisa_',
      footer: `GM: ${interaction.user.username}`,
      guild: interaction.guild,
    });
    await interaction.reply({ embeds: [e] });
    return;
  }

  if (sub === 'end') {
    const scene = stmts.getScene.get(gid) as any;
    if (!scene) {
      await interaction.reply({ content: 'Trenutno nema aktivne scene.', flags: MessageFlags.Ephemeral });
      return;
    }
    stmts.endScene.run(gid);
    stmts.endSceneLog.run(gid);
    await interaction.reply(`🎬 Scena **${scene.location}** je završena.`);
    return;
  }

  if (sub === 'log') {
    const scene = stmts.getScene.get(gid) as any;
    if (!scene) {
      await interaction.reply({ content: 'Nema aktivne scene. Pokreni je sa `/scene start`.', flags: MessageFlags.Ephemeral });
      return;
    }
    const text = interaction.options.getString('text', true);
    stmts.addLog.run(gid, interaction.user.id, text);
    await interaction.reply(`📝 <@${interaction.user.id}>: ${text}`);
    return;
  }

  if (sub === 'info') {
    const scene = stmts.getScene.get(gid) as any;
    if (!scene) {
      await interaction.reply({ content: 'Trenutno nema aktivne scene.', flags: MessageFlags.Ephemeral });
      return;
    }
    const limit = Math.min(20, Math.max(1, interaction.options.getInteger('limit') ?? 5));
    const rows = stmts.recentLog.all(gid, limit) as Array<{ user_id: string; text: string; created_at: number }>;
    const fields = [
      field('GM', `<@${scene.started_by}>`, true),
      field('Trajanje', `<t:${scene.started_at}:R>`, true),
    ];
    if (rows.length > 0) {
      const logText = rows.reverse().map(r => `• <@${r.user_id}>: ${r.text}`).join('\n').slice(0, 1024);
      fields.push(field(`Poslednjih ${rows.length}`, logText));
    } else {
      fields.push(field('Log', '_prazan_'));
    }
    const e = kgEmbed({
      title: `🎬 ${scene.location}`,
      banner: true,
      color: STYLE.brand,
      description: scene.description ?? '_bez opisa_',
      fields,
      guild: interaction.guild,
    });
    await interaction.reply({ embeds: [e] });
    return;
  }
}
