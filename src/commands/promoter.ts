import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags,
} from 'discord.js';
import { db, stmts } from '../lib/store.js';

export const data = new SlashCommandBuilder()
  .setName('promoter')
  .setDescription('Promoter sistem — kodovi i lestvica')
  .addSubcommand(s =>
    s.setName('moj-kod')
      .setDescription('Kreiraj/pogledaj svoj promoter kod (drugi unose pri prijavi)'),
  )
  .addSubcommand(s =>
    s.setName('claim')
      .setDescription('Unesi promoter kod osobe koja te je dovela (samo jednom)')
      .addStringOption(o =>
        o.setName('kod').setDescription('Promoter kod (6 karaktera)').setRequired(true).setMinLength(4).setMaxLength(12),
      ),
  )
  .addSubcommand(s =>
    s.setName('lestvica').setDescription('Top 10 promotera po broju dovedenih'),
  )
  .addSubcommand(s =>
    s.setName('moji-pozivi').setDescription('Pogledaj koliko si igrača doveo'),
  );

function genCode(userId: string): string {
  const seed = userId.slice(-4);
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `KG${seed}${r}`;
}

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return;
  const guildId = interaction.guildId!;
  const userId = interaction.user.id;
  const sub = interaction.options.getSubcommand();

  if (sub === 'moj-kod') {
    let row = db.prepare(`SELECT * FROM promoter_codes WHERE guild_id = ? AND user_id = ?`)
      .get(guildId, userId) as any;
    if (!row) {
      let code: string;
      let attempts = 0;
      do {
        code = genCode(userId);
        const exists = db.prepare(`SELECT 1 FROM promoter_codes WHERE code = ?`).get(code);
        if (!exists) break;
      } while (++attempts < 10);
      db.prepare(`INSERT INTO promoter_codes (code, guild_id, user_id) VALUES (?, ?, ?)`)
        .run(code!, guildId, userId);
      row = { code, uses: 0 };
    }
    const e = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle('🎟️  Tvoj promoter kod')
      .setDescription(`\`${row.code}\``)
      .addFields(
        { name: 'Iskorišćen', value: String(row.uses), inline: true },
        { name: 'Kako funkcioniše', value: 'Podeli ovaj kod prijateljima. Kad se prijave (`/promoter claim <kod>`), tebi se kreditira poziv. Top 10 svakog meseca dobija nagrade.', inline: false },
      );
    await interaction.reply({ embeds: [e], flags: MessageFlags.Ephemeral });
    return;
  }

  if (sub === 'claim') {
    const code = interaction.options.getString('kod', true).toUpperCase().trim();
    // Već imam claim?
    const exists = db.prepare(`SELECT * FROM promoter_refs WHERE referred_user = ? AND guild_id = ?`)
      .get(userId, guildId);
    if (exists) {
      await interaction.reply({ content: 'Već si iskoristio promoter kod. Samo jedan po nalogu.', flags: MessageFlags.Ephemeral });
      return;
    }
    const promoter = db.prepare(`SELECT * FROM promoter_codes WHERE code = ? AND guild_id = ?`)
      .get(code, guildId) as any;
    if (!promoter) {
      await interaction.reply({ content: `Kod \`${code}\` ne postoji.`, flags: MessageFlags.Ephemeral });
      return;
    }
    if (promoter.user_id === userId) {
      await interaction.reply({ content: 'Ne možeš da iskoristiš svoj kod.', flags: MessageFlags.Ephemeral });
      return;
    }
    db.prepare(`INSERT INTO promoter_refs (referred_user, guild_id, code, promoter_id, confirmed) VALUES (?, ?, ?, ?, 1)`)
      .run(userId, guildId, code, promoter.user_id);
    db.prepare(`UPDATE promoter_codes SET uses = uses + 1 WHERE code = ?`).run(code);
    await interaction.reply({ content: `✅ Hvala! <@${promoter.user_id}> je dobio +1 poziv.`, flags: MessageFlags.Ephemeral });
    return;
  }

  if (sub === 'lestvica') {
    const top = db.prepare(`
      SELECT promoter_id, COUNT(*) AS n
      FROM promoter_refs
      WHERE guild_id = ? AND confirmed = 1
      GROUP BY promoter_id
      ORDER BY n DESC
      LIMIT 10
    `).all(guildId) as Array<{ promoter_id: string; n: number }>;

    const e = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle('🏆  Top 10 promotera')
      .setDescription(
        top.length === 0
          ? '_Lestvica je prazna. Budi prvi! `/promoter moj-kod`._'
          : top.map((r, i) => `${['🥇','🥈','🥉','🏅','🏅','🏅','🏅','🏅','🏅','🏅'][i]} <@${r.promoter_id}> — **${r.n}** ${r.n === 1 ? 'poziv' : 'poziva'}`).join('\n')
      )
      .setFooter({ text: 'Top 3 svakog 1. u mesecu dobija VIP nagradu.' });
    await interaction.reply({ embeds: [e] });
    return;
  }

  if (sub === 'moji-pozivi') {
    const n = (db.prepare(`SELECT COUNT(*) AS n FROM promoter_refs WHERE guild_id = ? AND promoter_id = ? AND confirmed = 1`)
      .get(guildId, userId) as any).n;
    const recent = db.prepare(`SELECT referred_user, created_at FROM promoter_refs WHERE guild_id = ? AND promoter_id = ? ORDER BY created_at DESC LIMIT 5`)
      .all(guildId, userId) as any[];
    const e = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle('🎟️  Moji pozivi')
      .setDescription(`Doveo si **${n}** ${n === 1 ? 'igrača' : 'igrača'}.`)
      .addFields(recent.length > 0 ? [{
        name: 'Poslednjih 5',
        value: recent.map(r => `<@${r.referred_user}> — <t:${r.created_at}:R>`).join('\n'),
      }] : []);
    await interaction.reply({ embeds: [e], flags: MessageFlags.Ephemeral });
    return;
  }
}
