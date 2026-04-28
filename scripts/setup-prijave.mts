import 'dotenv/config';
import {
  Client, GatewayIntentBits, Events, ChannelType, PermissionFlagsBits,
  TextChannel, CategoryChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle,
} from 'discord.js';
import { kgEmbed, STYLE, steps } from '../src/lib/embedStyle.js';

const c = new Client({ intents: [GatewayIntentBits.Guilds] });

interface PrijavaDef {
  id: string;       // ticket category id (mora postojati u tickets.ts)
  channelName: string;
  emoji: string;
  title: string;
  short: string;    // kratak opis za kanal listing
  uslovi: string[]; // bullet listu
  pitanja: Array<[string, string]>; // step lista
  reviewer: string; // za footer
}

const PRIJAVE: PrijavaDef[] = [
  {
    id: 'p-admin',
    channelName: '〔🛡️〕〢ᴀᴅᴍɪɴ-ᴘʀɪᴊᴀᴠᴀ',
    emoji: '🛡️',
    title: 'Admin prijava',
    short: 'Postani Probni Moderator → Moderator → Stariji Moderator → Administrator',
    uslovi: [
      'Minimum 18 godina',
      'Verifikovan na serveru i belom listom odobren',
      'Aktivan u igri minimum 30h u poslednjih mesec dana',
      'Bez aktivnih warninga ili kazni u poslednjih 3 meseca',
      'Mikrofon obavezan',
    ],
    pitanja: [
      ['Ime i prezime (IRL)',     'Tvoje pravo ime'],
      ['Godine',                  '18+ obavezno'],
      ['Discord ID + IC ime',     'Discord ID i ime tvog karaktera u igri'],
      ['Iskustvo u modovanju',    'Prošli serveri, role, period'],
      ['Zašto želiš da budeš admin', 'Konkretno — šta hoćeš da radiš'],
      ['Tipičan dnevni interval', 'Kad si online (jutro/podne/veče)'],
      ['Kako rešavaš konflikt',   'Primer: 2 igrača se prepiru, jedan pokazuje na drugog'],
    ],
    reviewer: 'Vlasnici',
  },
  {
    id: 'p-wladmin',
    channelName: '〔📥〕〢ᴡʟ-ᴀᴅᴍɪɴ-ᴘʀɪᴊᴀᴠᴀ',
    emoji: '📥',
    title: 'White lista admin prijava',
    short: 'Pregled white lista prijava — odobravanje/odbijanje novih igrača',
    uslovi: [
      'Minimum 16 godina',
      'Verifikovan, aktivan u igri 20h+ mesečno',
      'Dobre komunikacione veštine',
      'Razumevanje RP osnova i serverskih pravila',
      'Strpljen, ume da odgovori bez agresije',
    ],
    pitanja: [
      ['Ime i prezime',           'Tvoje pravo ime'],
      ['Godine',                  '16+'],
      ['Iskustvo sa moderacijom', 'Discord/forumi/RP serveri'],
      ['Koliko prijava bi pregledao dnevno', 'Realna procena'],
      ['Test scenario',           'Kandidat napiše prijavu sa malim greškama u IC/OOC. Šta uradiš?'],
    ],
    reviewer: 'Glavni administratori',
  },
  {
    id: 'p-promoter',
    channelName: '〔🎟️〕〢ᴘʀᴏᴍᴏᴛᴇʀ-ᴘʀɪᴊᴀᴠᴀ',
    emoji: '🎟️',
    title: 'Promoter prijava',
    short: 'Aktivno dovedi nove igrače na server, dobij nagrade i Promoter rolu',
    uslovi: [
      '15+ godina',
      'Aktivan korisnik društvenih mreža (TikTok / Instagram / YouTube / Twitch)',
      'Minimum 100 pratilaca na bilo kojoj platformi',
      'Spreman da pravi sadržaj o serveru',
    ],
    pitanja: [
      ['Tvoje ime + Discord',     'Pravo ime + tag'],
      ['Platforme i linkovi',     'TikTok / IG / YT linkovi'],
      ['Broj pratilaca po platformi', 'Konkretni brojevi'],
      ['Tipovi sadržaja koje pravim', 'Klipovi, streamovi, edits, vlogovi…'],
      ['Plan promocije',          'Kako misliš da promovišeš naš server'],
    ],
    reviewer: 'Tim podrške',
  },
  {
    id: 'p-strimer',
    channelName: '〔📺〕〢ꜱᴛʀɪᴍᴇʀ-ᴘʀɪᴊᴀᴠᴀ',
    emoji: '📺',
    title: 'Strimer prijava',
    short: 'Dobij Strimer rolu i live ping kanal kada si live (Twitch/YouTube/Kick)',
    uslovi: [
      'Verifikovan i odobren na white listi',
      'Aktivan strim minimum 2× nedeljno',
      'Prosečno 5+ gledalaca po stream-u',
      'Stream sa servera (FiveM RP)',
    ],
    pitanja: [
      ['Discord + IC ime',        'Tag + ime karaktera'],
      ['Platforma + link',        'Twitch / YT / Kick / Trovo'],
      ['Frekvencija strimova',    'Koliko puta nedeljno'],
      ['Prosečan broj gledalaca', 'Realna procena (poslednjih 5 stream-ova)'],
      ['Da li si već strimovao naš server', 'Linkovi clip-ova ako ih imaš'],
    ],
    reviewer: 'Media tim',
  },
  {
    id: 'p-beta',
    channelName: '〔🧪〕〢ʙᴇᴛᴀ-ᴛᴇꜱᴛᴇʀ-ᴘʀɪᴊᴀᴠᴀ',
    emoji: '🧪',
    title: 'Beta tester prijava',
    short: 'Testiraj nove update-e pre nego što izadju u javnu verziju',
    uslovi: [
      'Verifikovan i white-listan',
      'Aktivan u igri 15h+ mesečno',
      'Spreman za detaljno bug raportiranje',
      'Strpljiv (ima crash-ova i nestabilnosti u beta okruženju)',
    ],
    pitanja: [
      ['Discord + IC ime',        'Tag + ime karaktera'],
      ['Iskustvo sa beta testiranjem', 'Bilo koja igra/aplikacija'],
      ['Tehnički nivo',           'Početnik / srednji / napredni / programer'],
      ['Koliko vremena nedeljno',  'Realna procena'],
      ['Primer bug raporta',      'Opiši kako bi prijavio bug — šta je važno?'],
    ],
    reviewer: 'Developeri',
  },
  {
    id: 'p-pd',
    channelName: '〔🚔〕〢ᴘᴅ-ɴᴀᴄᴇʟɴɪᴋ-ᴘʀɪᴊᴀᴠᴀ',
    emoji: '🚔',
    title: 'PD načelnik prijava',
    short: 'Vodi celu policijsku frakciju — najodgovornija pozicija u dr. službama',
    uslovi: [
      'Minimum 20 godina',
      'Iskustvo u PD frakciji minimum 3 meseca (na nekom serveru)',
      'Bez aktivnih warninga',
      'Mikrofon obavezan',
      'Aktivan 25h+ mesečno',
    ],
    pitanja: [
      ['Ime i prezime + Discord', 'Pravo ime + tag'],
      ['Godine + iskustvo u PD',  'Koliko meseci, koje rang'],
      ['Vizija PD frakcije',      'Kako bi vodio i unapredio'],
      ['Plan obuke novih',        'Kako bi obučavao novajlije'],
      ['Saradnja sa drugim frakcijama', 'EMS, mafija — kako rešavaš tenzije'],
      ['Kazneni sistem',          'Kako daješ disciplinske mere'],
    ],
    reviewer: 'Vlasnici',
  },
  {
    id: 'p-bolnica',
    channelName: '〔🏥〕〢ʙᴏʟɴɪᴄᴀ-ᴅɪʀᴇᴋᴛᴏʀ-ᴘʀɪᴊᴀᴠᴀ',
    emoji: '🏥',
    title: 'Bolnica direktor prijava',
    short: 'Direktor EMS frakcije — vodi medicinski tim i bolnicu',
    uslovi: [
      'Minimum 19 godina',
      'Iskustvo u EMS frakciji min 2 meseca',
      'Bez kazni',
      'Mikrofon obavezan',
      'Aktivan 20h+ mesečno',
    ],
    pitanja: [
      ['Ime i prezime + Discord', 'Pravo ime + tag'],
      ['Godine + EMS iskustvo',   'Koliko, gde, koja rang'],
      ['Kako bi vodio bolnicu',   'Plan rada i protokoli'],
      ['Plan obuke novih',        'Kako se rasporedjuju novi medicinari'],
      ['Saradnja sa PD',          'Kako rešavaš situacije sa kriminalom'],
      ['Etika',                   'Lečiš li i kriminalce na licu mesta?'],
    ],
    reviewer: 'Vlasnici',
  },
  {
    id: 'p-event',
    channelName: '〔🎪〕〢ᴇᴠᴇɴᴛ-ᴛɪᴍ-ᴘʀɪᴊᴀᴠᴀ',
    emoji: '🎪',
    title: 'Event tim prijava',
    short: 'Organizuj javne event-e (trke, takmičenja, drift sastanci…)',
    uslovi: [
      'Verifikovan',
      'Kreativan, sa idejama za event-e',
      'Mikrofon',
      'Iskustvo organizovanja je plus',
    ],
    pitanja: [
      ['Discord + IC ime',        'Tag + ime karaktera'],
      ['Iskustvo organizacije',   'Bilo gde — IRL ili u igri'],
      ['3 ideje za event',        'Konkretno: ime + opis + ko učestvuje'],
      ['Koliko event-a mesečno',  'Realna procena vremena'],
    ],
    reviewer: 'Event tim',
  },
  {
    id: 'p-mafija',
    channelName: '〔🏴〕〢ᴍᴀꜰɪᴊᴀ-ʟɪᴅᴇʀ-ᴘʀɪᴊᴀᴠᴀ',
    emoji: '🏴',
    title: 'Mafija / Kartel lider prijava',
    short: 'Liderstvo nad organizacijom (pakovanje 30€ ili više iz donacija)',
    uslovi: [
      'Minimum 18 godina',
      'Verifikovan i aktivan 30h+ mesečno',
      'Bez kazni',
      'Mikrofon obavezan',
      'Donacija paket "Velika organizacija" (30€) ili dogovor sa Vlasnicima',
    ],
    pitanja: [
      ['Discord + IC ime',          'Tag + ime karaktera'],
      ['Predloženo ime org',        'Ime mafije/kartela'],
      ['Tip biznisa',               'Drogerija / oružje / pranje novca / kombinacija'],
      ['Koje članove imaš već',     'Lista discord tag-ova'],
      ['Vizija konfliktnih situacija', 'Kako rešavaš war sa drugom organizacijom'],
      ['IC-OOC granica',            'Kako sprečavaš da OOC drama pređe u IC'],
    ],
    reviewer: 'Suvlasnici',
  },
];

c.once(Events.ClientReady, async () => {
  const guild = await c.guilds.fetch(process.env.GUILD_ID!).then(g => g.fetch());
  const channels = await guild.channels.fetch();

  // 1. Pravimo (ili pronalazimo) kategoriju "ᴘʀɪᴊᴀᴠᴇ"
  let cat = [...channels.values()].find(
    ch => ch?.type === ChannelType.GuildCategory && /ᴘʀɪᴊᴀᴠᴇ/i.test(ch.name) && !/wl/i.test(ch.name),
  ) as CategoryChannel | undefined;
  if (!cat) {
    cat = await guild.channels.create({
      name: '» 📥 ᴘʀɪᴊᴀᴠᴇ «',
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel] },
      ],
    });
    console.log(`+ kategorija: ${cat.name}`);
  }

  async function purge(ch: TextChannel) {
    let last: string | undefined;
    while (true) {
      const msgs = await ch.messages.fetch({ limit: 100, before: last });
      if (msgs.size === 0) break;
      const young = msgs.filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 3600 * 1000);
      if (young.size > 1) await ch.bulkDelete(young, true).catch(() => {});
      else for (const m of young.values()) try { await m.delete(); } catch {}
      const old = msgs.filter(m => Date.now() - m.createdTimestamp >= 14 * 24 * 3600 * 1000);
      for (const m of old.values()) { try { await m.delete(); } catch {} await new Promise(r => setTimeout(r, 350)); }
      last = msgs.last()?.id;
      if (msgs.size < 100) break;
    }
  }

  // 2. Pravimo (ili nalazimo) kanale unutar kategorije
  for (const p of PRIJAVE) {
    let ch = [...channels.values()].find(c => c?.name === p.channelName) as TextChannel | undefined;
    if (!ch) {
      ch = await guild.channels.create({
        name: p.channelName,
        type: ChannelType.GuildText,
        parent: cat.id,
        topic: `${p.title} — ${p.short}`,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.SendMessages] },
        ],
      });
      console.log(`+ kanal: ${p.channelName}`);
    } else if ((ch as any).parentId !== cat.id) {
      try { await ch.setParent(cat.id); console.log(`mv → kategorija: ${p.channelName}`); } catch {}
    }

    await purge(ch);

    const e = kgEmbed({
      title: p.title,
      banner: true,
      color: STYLE.brand,
      description: p.short + '\n\nKlikni dugme **Predaj prijavu** ispod — otvoriće se forma sa pitanjima.',
      fields: [
        { name: 'Uslovi', value: p.uslovi.map(s => `> • ${s}`).join('\n') },
        { name: 'Pitanja u formi', value: steps(p.pitanja) },
      ],
      footer: `Pregled: ${p.reviewer} • Odgovor DM-om u 24-72h`,
      guild,
    });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`tcat:${p.id}`)
        .setLabel('Predaj prijavu')
        .setEmoji(p.emoji)
        .setStyle(ButtonStyle.Primary),
    );

    await ch.send({ embeds: [e], components: [row] });
    console.log(`OK ${p.title}`);
  }

  console.log('\nDONE');
  await c.destroy();
  process.exit(0);
});

await c.login(process.env.DISCORD_TOKEN);
