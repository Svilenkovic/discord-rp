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
    const e = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle('💎  Donacije — KG Balkan RP')
      .setDescription([
        'Server živi od donacija — pokrivamo licence, hosting, mape, custom skripte.',
        '**Hvala što doprinosiš!** ❤️',
        '',
        '**Komanda:** `/donate` — pregled svih paketa',
        '**Lista paketa:** ispod',
        '**Pravila donacija:** <#1496653487164100798>',
        '**Načini uplate:** <#1496653485465403482>',
        '**Dokaz uplate:** <#1496653495590457375>',
        '',
        '_Donacija nije obavezna i ne daje IC prednosti — samo OOC pogodnosti i kozmetiku._',
      ].join('\n'));
    await donInfo.send({ embeds: [e] });
    console.log('OK #donacije-info');
  }

  if (paketi) {
    await purge(paketi);
    const grouped = packagesByCategory();
    for (const [cat, pkgs] of Object.entries(grouped)) {
      const colors: Record<string, number> = {
        'VIP': 0xf5c542, 'Vozila': 0x3498db, 'Telefon': 0x9b59b6,
        'Biznis': 0x27ae60, 'Organizacije': 0x8e44ad,
        'Imovina': 0xe67e22, 'Ostalo': 0x95a5a6,
      };
      const e = new EmbedBuilder()
        .setColor(colors[cat] ?? 0x5865f2)
        .setTitle(`${({VIP:'⭐',Vozila:'🚗',Telefon:'📱',Biznis:'🏢',Organizacije:'🏴',Imovina:'🏠',Ostalo:'🎁'}[cat] ?? '💎')}  ${cat}`)
        .setDescription(pkgs.map(p => {
          const perks = p.perks.map(x => `> • ${x}`).join('\n');
          return `**${p.name}** — \`${p.price}\`\n${perks}`;
        }).join('\n\n'));
      await paketi.send({ embeds: [e] });
    }
    const cta = new EmbedBuilder()
      .setColor(0xfee75c)
      .setDescription('Spreman za donaciju? Pokreni `/donate` ili otvori `/ticket razlog:donacija`. Tim donacija <@&1496653425352376330> će ti odgovoriti.');
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
    const e = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('🎟️  Promoter sistem — pozovi prijatelje, dobij nagrade!')
      .setDescription([
        '**Kako funkcioniše:**',
        '`①` Pokreni `/promoter moj-kod` — dobiješ jedinstven kod',
        '`②` Podeli kod prijateljima',
        '`③` Kad se prijave, oni rade `/promoter claim kod:<TVOJKOD>`',
        '`④` Tebi se kreditira poziv',
        '',
        '**Nagrade (mesečno):**',
        '🥇 1. mesto: VIP Gold (2000 RSD vrednost)',
        '🥈 2. mesto: VIP Silver (1000 RSD)',
        '🥉 3. mesto: VIP Bronze (500 RSD)',
        '🏅 4-10. mesto: Custom tablica',
        '',
        '**Lestvica:** `/promoter lestvica`',
        '**Tvoji pozivi:** `/promoter moji-pozivi`',
      ].join('\n'));
    await oglasi.send({ embeds: [e] }).catch(() => {});
    console.log('OK promoter info');
  }

  console.log('\nDONE');
  await c.destroy();
  process.exit(0);
});

await c.login(process.env.DISCORD_TOKEN);
