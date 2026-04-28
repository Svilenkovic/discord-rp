import 'dotenv/config';
import {
  Client, GatewayIntentBits, Events, ChannelType, EmbedBuilder, TextChannel,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
} from 'discord.js';
import { PACKAGES, packagesByCategory } from '../src/lib/donations.js';

const c = new Client({ intents: [GatewayIntentBits.Guilds] });

c.once(Events.ClientReady, async () => {
  const guild = await c.guilds.fetch(process.env.GUILD_ID!).then(g => g.fetch());
  const channels = await guild.channels.fetch();
  const find = (re: RegExp) =>
    [...channels.values()].find(ch => ch && ch.type === ChannelType.GuildText && re.test(ch.name)) as TextChannel | undefined;

  // ── DONACIJE ──
  const donInfo = find(/donacije-info|ᴅᴏɴᴀᴄɪᴊᴇ-ɪɴꜰᴏ/i);
  const paketi = find(/paketi-donacija|ᴘᴀᴋᴇᴛɪ-ᴅᴏɴᴀᴄɪᴊᴀ/i);

  async function purge(ch: TextChannel) {
    let last: string | undefined;
    while (true) {
      const msgs = await ch.messages.fetch({ limit: 100, before: last });
      if (msgs.size === 0) break;
      const young = msgs.filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 3600 * 1000);
      if (young.size > 1) await ch.bulkDelete(young, true).catch(() => {});
      else for (const m of young.values()) try { await m.delete(); } catch {}
      const old = msgs.filter(m => Date.now() - m.createdTimestamp >= 14 * 24 * 3600 * 1000);
      for (const m of old.values()) { try { await m.delete(); } catch {} await new Promise(r => setTimeout(r, 400)); }
      last = msgs.last()?.id;
      if (msgs.size < 100) break;
    }
  }

  if (donInfo) {
    await purge(donInfo);
    const { kgEmbed, STYLE } = await import('../src/lib/embedStyle.js');
    const e = kgEmbed({
      title: 'Donacije — KG Balkan RP',
      banner: true,
      color: STYLE.brand,
      description: [
        'Server živi od donacija — pokrivamo licence, hosting, mape, custom skripte.',
        '',
        '> **Komanda:** `/donate` — pregled svih paketa',
        '> **Lista paketa:** ispod (pregled po kategoriji)',
        '> **Pravila donacija:** <#1496653487164100798>',
        '> **Načini uplate:** <#1496653485465403482>',
        '> **Dokaz uplate:** <#1496653495590457375>',
        '',
        '_Donacija nije obavezna. Ne daje IC prednost — samo OOC pogodnosti i kozmetiku._',
      ].join('\n'),
      footer: 'Hvala što doprinosiš ❤️',
      guild,
    });
    await donInfo.send({ embeds: [e] });
    console.log('OK #donacije-info');
  }

  if (paketi) {
    await purge(paketi);
    const grouped = packagesByCategory();
    const { kgEmbed, STYLE } = await import('../src/lib/embedStyle.js');
    const colors: Record<string, number> = {
      'Karakter':         STYLE.primary,
      'Priority Queue':   STYLE.warning,
      'Organizacija':     STYLE.purple,
      'Org. nadogradnja': STYLE.cyan,
      'Vozila':           STYLE.info,
      'Helikopteri':      STYLE.danger,
      'Imovina':          STYLE.orange,
      'Ostalo':           0x95a5a6,
    };
    const icons: Record<string, string> = {
      'Karakter': '🧍',
      'Priority Queue': '⚡',
      'Organizacija': '🏴',
      'Org. nadogradnja': '🛠️',
      'Vozila': '🚗',
      'Helikopteri': '🚁',
      'Imovina': '🏠',
      'Ostalo': '🎁',
    };
    for (const [cat, pkgs] of Object.entries(grouped)) {
      const e = kgEmbed({
        title: `${icons[cat] ?? '💎'}  ${cat}`,
        banner: true,
        color: colors[cat] ?? STYLE.primary,
        description: pkgs.map(p => {
          const perks = p.perks.map(x => `> • ${x}`).join('\n');
          return `**${p.name}** — \`${p.price}\`\n${perks}`;
        }).join('\n\n'),
        guild,
      });
      await paketi.send({ embeds: [e] });
    }
    const cta = kgEmbed({
      title: 'Spreman za donaciju?',
      color: STYLE.brand,
      description: 'Pokreni `/donate` za interaktivni pregled, ili otvori `/ticket` sa kategorijom **Donacija**.\n\nTim donacija <@&1496653425352376330> će ti odgovoriti u roku od 24h.',
      footer: 'Hvala što doprinosiš ❤️',
      guild,
    });
    await paketi.send({ embeds: [cta] });
    console.log('OK #paketi-donacija');
  }

  // ── PROMOTERI ──
  // Nadji bilo koji info kanal
  const oglasi = find(/oglasi-organizacija|ᴏɢʟᴀꜱɪ-ᴏʀɢᴀɴɪᴢᴀᴄɪᴊᴀ/i)
    ?? find(/dobrodosli|ᴅᴏʙʀᴏᴅᴏꜱʟɪ/i);
  // postavi promoter info na "info" kanale
  // (samo ako kanal postoji)

  // Posebno: postavi /promoter info u dobrodosli kao add-on poruku
  if (oglasi) {
    const { kgEmbed, STYLE, steps } = await import('../src/lib/embedStyle.js');
    const e = kgEmbed({
      title: 'Promoter sistem — pozovi prijatelje, dobij nagrade',
      banner: true,
      color: STYLE.success,
      description: 'Dovedi prijatelje na server i kvalifikuj se za mesečne nagrade.',
      fields: [
        { name: 'Kako funkcioniše', value: steps([
          ['Generiši kod', '`/promoter moj-kod` — dobiješ jedinstven kod'],
          ['Podeli', 'Pošalji kod prijateljima'],
          ['Claim', 'Kad se prijave: `/promoter claim kod:<TVOJKOD>`'],
          ['Nagrada', 'Tebi se kreditira poziv'],
        ]) },
        { name: 'Nagrade (mesečno)', value: [
          '🥇 1. mesto — Priority Queue 50 (50€ vrednost)',
          '🥈 2. mesto — Priority Queue 30',
          '🥉 3. mesto — Priority Queue 10',
          '🏅 4-10. mesto — Custom tablica',
        ].join('\n') },
        { name: 'Komande', value: '`/promoter lestvica` • `/promoter moji-pozivi`', inline: false },
      ],
      guild,
    });
    await oglasi.send({ embeds: [e] }).catch(() => {});
    console.log('OK promoter info');
  }

  console.log('\nDONE');
  await c.destroy();
  process.exit(0);
});

await c.login(process.env.DISCORD_TOKEN);
