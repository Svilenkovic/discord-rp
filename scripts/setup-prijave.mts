import 'dotenv/config';
import {
  Client, GatewayIntentBits, Events, ChannelType, PermissionFlagsBits,
  TextChannel, CategoryChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle,
} from 'discord.js';
import { kgEmbed, STYLE, steps } from '../src/lib/embedStyle.js';

const c = new Client({ intents: [GatewayIntentBits.Guilds] });

interface PrijavaDef {
  id: string;
  channelName: string;
  emoji: string;
  title: string;
  short: string;
  uslovi: string[];
  pitanja: Array<[string, string]>;
  reviewer: string;
  nagrade: string[]; // šta kandidat zaradjuje (kredit za donatorske stvari)
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
    nagrade: [
      '**5€ kredit** za svaku odrađenu smenu od 10h+ na poziciji',
      'Bonus **+10€** ako rešiš 50+ tiketa u mesecu',
      'Sav kredit se troši za donatorske stvari (vozila, tablice, izgled, organizacije)',
    ],
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
    nagrade: [
      '**Tier sistem po dovedenim igračima** (sa 10h+ in-game vremena):',
      '> • 1-9 igrača — **2€** po dovedenom',
      '> • 10-24 igrača — **3€** po svakom narednom (+25€ kumulativno na pragu)',
      '> • 25-49 igrača — **4€** po svakom narednom',
      '> • 50+ igrača — **5€** po svakom narednom',
      '_Igrač upiše tvoj kod pri ulasku (`/promoter claim`). Kad pređe 10h, kredit se automatski dodeljuje._',
    ],
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
    nagrade: [
      '**10€ kredit** po stream-u od 5h+ sa servera',
      '**+15€ bonus** ako stream prosečno ima 20+ gledalaca',
      'Pristup **#strimeri-live** kanalu — automatski ping kad si live',
      'Custom Strimer rola sa specijalnom bojom imena',
    ],
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
    nagrade: [
      '**2€ kredit** po validnom bug raportu',
      '**+5€** za bugove visokog prioriteta (game-breaking, exploit)',
      'Pristup beta serveru pre javne verzije',
      'Ime u credits-u updata u kojem si pomogao',
    ],
  },
  {
    id: 'p-pd',
    channelName: '〔🚔〕〢ᴘᴅ-ɴᴀᴄᴇʟɴɪᴋ-ᴘʀɪᴊᴀᴠᴀ',
    emoji: '🚔',
    title: 'PD načelnik prijava',
    short: 'Vodiš celu policijsku frakciju — moraš već imati ekipu spremnu za rad',
    uslovi: [
      'Imaš već formiranu ekipu (minimum 5 ljudi koji su spremni da budu u PD-u)',
      'Lista članova sa Discord tagovima ide u prijavu',
      'Spreman si da preuzmeš odgovornost za rad cele frakcije',
    ],
    pitanja: [
      ['Discord + IC ime',          'Tag + ime karaktera'],
      ['Tvoja ekipa',               'Discord tagovi članova ekipe (min 5) i njihove planirane rang'],
      ['Vizija PD frakcije',        'Kako vodiš i unapređuješ'],
      ['Plan obuke novih',          'Kako obučavaš novajlije'],
      ['Saradnja sa drugim frakcijama', 'EMS, mafija — kako rešavaš tenzije'],
      ['Kazneni sistem',            'Kako daješ disciplinske mere unutar frakcije'],
    ],
    reviewer: 'Vlasnici',
    nagrade: [
      '**5€ kredit** za 10h+ odrađene smene mesečno',
      '**+20€ bonus** za uspešno odrađen mesec (bez disciplinskih problema u frakciji)',
      'Custom uniforma + voznii park PD-a',
      'Lider PC u stanici (admin panel za frakciju)',
    ],
  },
  {
    id: 'p-bolnica',
    channelName: '〔🏥〕〢ʙᴏʟɴɪᴄᴀ-ᴅɪʀᴇᴋᴛᴏʀ-ᴘʀɪᴊᴀᴠᴀ',
    emoji: '🏥',
    title: 'Bolnica direktor prijava',
    short: 'Direktor EMS frakcije — moraš imati ekipu spremnu da pokrije smene',
    uslovi: [
      'Imaš već formiranu ekipu (minimum 5 medicinara/medicinarki)',
      'Lista članova sa Discord tagovima ide u prijavu',
      'Spreman si da preuzmeš odgovornost za rad bolnice',
    ],
    pitanja: [
      ['Discord + IC ime',          'Tag + ime karaktera'],
      ['Tvoja ekipa',               'Discord tagovi članova ekipe (min 5) i njihove uloge'],
      ['Kako vodiš bolnicu',        'Plan rada i protokoli'],
      ['Plan obuke novih',          'Kako rasporedjuješ nove medicinare'],
      ['Saradnja sa PD',            'Kako rešavaš situacije sa kriminalom na licu mesta'],
      ['Etika',                     'Lečiš li i kriminalce?'],
    ],
    reviewer: 'Vlasnici',
    nagrade: [
      '**5€ kredit** za 10h+ odrađene smene mesečno',
      '**+20€ bonus** za uspešno odrađen mesec',
      'Custom medicinska oprema + helikopter za hitnu',
      'Lider PC u bolnici (admin panel za frakciju)',
    ],
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
    nagrade: [
      '**15€ kredit** za organizovan event sa 10+ učesnika',
      '**+5€** za svaki naredni učesnik preko 20',
      '**+50€ bonus** za ceo event-arc (3+ event-a u nizu sa istim narativnim lukom)',
      'Pristup event resursima (custom mapa, NPC trigger-i, blocked zones)',
    ],
  },
  {
    id: 'p-mafija',
    channelName: '〔🏴〕〢ᴍᴀꜰɪᴊᴀ-ʟɪᴅᴇʀ-ᴘʀɪᴊᴀᴠᴀ',
    emoji: '🏴',
    title: 'Mafija / Kartel lider prijava',
    short: 'Liderstvo nad organizacijom — moraš već imati formiranu ekipu i ideju',
    uslovi: [
      'Imaš već formiranu ekipu (minimum 5 članova)',
      'Lista članova sa Discord tagovima ide u prijavu',
      'Donacija paket organizacije ili dogovor sa Vlasnicima',
    ],
    pitanja: [
      ['Discord + IC ime',           'Tag + ime karaktera'],
      ['Predloženo ime org',         'Ime mafije/kartela'],
      ['Tip biznisa',                'Drogerija / oružje / pranje novca / kombinacija'],
      ['Tvoja ekipa',                'Discord tagovi članova (min 5) i njihove uloge u org'],
      ['Vizija konfliktnih situacija', 'Kako rešavaš war sa drugom organizacijom'],
      ['IC-OOC granica',             'Kako sprečavaš da OOC drama pređe u IC'],
    ],
    reviewer: 'Suvlasnici',
    nagrade: [
      'Custom mapa baze + custom outfiti + voznik park (uključeno u paket)',
      'Privatna radio frekvencija + sef + garaža',
      '**+5€ kredit mesečno** za vlasnika ako ekipa aktivno igra (10h+ po članu)',
      'Mogućnost teritorijalnog rata sa drugom org (event)',
    ],
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

    const fields = [
      { name: 'Uslovi', value: p.uslovi.map(s => `> • ${s}`).join('\n') },
      { name: 'Pitanja u formi', value: steps(p.pitanja) },
    ];
    if (p.nagrade.length > 0) {
      fields.push({ name: '🎁 Nagrade (kredit za donatorske stvari)', value: p.nagrade.map(s => s.startsWith('>') ? s : `> ${s}`).join('\n') });
    }
    const e = kgEmbed({
      title: p.title,
      banner: true,
      color: STYLE.brand,
      description: p.short + '\n\nKlikni dugme **Predaj prijavu** ispod — otvoriće se forma sa pitanjima.',
      fields,
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
