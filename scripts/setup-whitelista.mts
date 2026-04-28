import 'dotenv/config';
import {
  Client, GatewayIntentBits, Events, ChannelType, EmbedBuilder, TextChannel, CategoryChannel,
} from 'discord.js';
import { kgEmbed, STYLE, steps } from '../src/lib/embedStyle.js';

const c = new Client({ intents: [GatewayIntentBits.Guilds] });

c.once(Events.ClientReady, async () => {
  const guild = await c.guilds.fetch(process.env.GUILD_ID!).then(g => g.fetch());
  const channels = await guild.channels.fetch();

  // Rename mapa: stari pattern → novi naziv
  const renames: Array<[RegExp, string]> = [
    [/^» 🧾 ʙᴇʟᴀ ʟɪꜱᴛᴀ «$/i, '» 🧾 ᴡʜɪᴛᴇ ʟɪꜱᴛᴀ «'],
    [/ʙᴇʟᴀ-ʟɪꜱᴛᴀ-ɪɴꜰᴏ/i,   '〔🧾〕〢ᴡʜɪᴛᴇ-ʟɪꜱᴛᴀ-ɪɴꜰᴏ'],
    [/ʙᴇʟᴀ-ʟɪꜱᴛᴀ-ᴘʀɪᴊᴀᴠᴀ/i, '〔🧾〕〢ᴡʜɪᴛᴇ-ʟɪꜱᴛᴀ-ᴘʀɪᴊᴀᴠᴀ'],
    [/ʙᴇʟᴀ-ʟɪꜱᴛᴀ-ʀᴇᴢᴜʟᴛᴀᴛɪ/i, '〔🧾〕〢ᴡʜɪᴛᴇ-ʟɪꜱᴛᴀ-ʀᴇᴢᴜʟᴛᴀᴛɪ'],
    [/ʙᴇʟᴀ-ʟɪꜱᴛᴀ-ꜰᴀǫ/i,    '〔❓〕〢ᴡʜɪᴛᴇ-ʟɪꜱᴛᴀ-ꜰᴀǫ'],
    [/ᴡʟ-ᴀᴅᴍɪɴ-ᴘʀɪᴊᴀᴠᴇ/i,   '〔📥〕〢ᴡʜɪᴛᴇ-ʟɪꜱᴛᴀ-ᴀᴅᴍɪɴ'],
  ];

  for (const ch of channels.values()) {
    if (!ch) continue;
    for (const [re, newName] of renames) {
      if (re.test(ch.name) && ch.name !== newName) {
        try {
          await ch.setName(newName);
          console.log(`rename: ${ch.name} → ${newName}`);
        } catch (e: any) {
          console.log(`rename fail ${ch.name}: ${e.message}`);
        }
        break;
      }
    }
  }

  // Re-fetch jer su se imena promenila
  const fresh = await guild.channels.fetch();
  const findCh = (re: RegExp) =>
    [...fresh.values()].find(c => c?.type === ChannelType.GuildText && re.test(c.name)) as TextChannel | undefined;

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

  const info     = findCh(/ᴡʜɪᴛᴇ-ʟɪꜱᴛᴀ-ɪɴꜰᴏ/i);
  const prijava  = findCh(/ᴡʜɪᴛᴇ-ʟɪꜱᴛᴀ-ᴘʀɪᴊᴀᴠᴀ/i);
  const rezultati= findCh(/ᴡʜɪᴛᴇ-ʟɪꜱᴛᴀ-ʀᴇᴢᴜʟᴛᴀᴛɪ/i);
  const faq      = findCh(/ᴡʜɪᴛᴇ-ʟɪꜱᴛᴀ-ꜰᴀǫ/i);

  // ── INFO ──
  if (info) {
    await purge(info);
    const e = kgEmbed({
      title: 'White lista — info',
      banner: true,
      color: STYLE.brand,
      description: 'White lista (whitelist) je provera pre nego što počneš da igraš na serveru. Cilj: sigurnost da znaš osnovne RP norme i da imaš ozbiljnu nameru.',
      fields: [
        { name: 'Šta dobijaš odobrenjem', value: [
          '> • Pristup FiveM serveru (connect IP)',
          '> • Ulogu **Verifikovan Igrač** + **Član**',
          '> • Pristup org/biznis kanalima i RP komandama u igri',
        ].join('\n') },
        { name: 'Uslovi za prijavu', value: [
          '> • **14+ godina** (mlađi po izuzetku, sa GM odobrenjem)',
          '> • Pročitana **Pravila servera** i **RP pravila**',
          '> • Razumevanje IC/OOC podele',
          '> • Mikrofon (preporučeno, ne obavezno)',
        ].join('\n') },
        { name: 'Kako predaš prijavu', value: [
          '`①` Idi u <#' + (prijava?.id ?? '0') + '>',
          '`②` Pokreni komandu `/apply`',
          '`③` Klikni dugme **Otvori formu** i popuni 5 pitanja',
          '`④` Čekaj odgovor — DM stiže za 24h',
        ].join('\n') },
        { name: 'Trajanje', value: '> Prosečno **6-24h**. Hitno je preko `/ticket` (kategorija White lista).', inline: true },
        { name: 'Ako te odbiju', value: '> Možeš podneti novu prijavu **posle 7 dana** sa popravljenim odgovorima.', inline: true },
      ],
      footer: 'Tim White liste odgovara DM-om',
      guild,
    });
    await info.send({ embeds: [e] });
    console.log('OK info');
  }

  // ── PRIJAVA ──
  if (prijava) {
    await purge(prijava);
    const e = kgEmbed({
      title: 'Predaj prijavu',
      banner: true,
      color: STYLE.success,
      description: 'Klikni komandu `/apply` ispod ili otkucaj je sam — otvoriće se forma sa 5 pitanja.',
      fields: [
        { name: 'Pitanja u formi', value: steps([
          ['Ime i prezime', 'Tvoje IRL ime — koristi se za kreiranje IC karaktera'],
          ['Godine', '14+ obavezno'],
          ['RP iskustvo', 'Kratak opis prošlih servera/karaktera ili "novajlija sam"'],
          ['Ideja za lika', 'Ime, klasa/posao, kratka pozadina (2-3 rečenice)'],
          ['Zašto baš naš server', 'Šta ti je privuklo pažnju'],
        ]) },
        { name: 'Posle predaje', value: '> Tim white liste će videti tvoju prijavu u admin kanalu i odlučiti **Odobri/Odbij**. DM ti dolazi posle odluke.', inline: false },
      ],
      footer: 'Komanda: /apply  •  Ne otvaraj duplikate prijava',
      guild,
    });
    await prijava.send({ embeds: [e] });
    console.log('OK prijava');
  }

  // ── REZULTATI ──
  if (rezultati) {
    await purge(rezultati);
    const e = kgEmbed({
      title: 'Rezultati white liste',
      banner: true,
      color: STYLE.info,
      description: 'U ovom kanalu se objavljuju **odobrene** prijave. Svako odobrenje ide automatski.',
      fields: [
        { name: 'Šta vidim ovde', value: [
          '> • Listu poslednjih odobrenih igrača',
          '> • Datum odobrenja',
          '> • Ime karaktera (IC)',
        ].join('\n') },
        { name: 'Šta se dešava posle odobrenja', value: [
          '> • Dobiješ ulogu **Verifikovan Igrač** + **Član**',
          '> • Dobiješ DM od bot-a sa instrukcijama za connect',
          '> • Server IP nadjes u <#1496856902322098187>',
        ].join('\n') },
      ],
      footer: 'Odbijene prijave NISU javne — DM stiže privatno',
      guild,
    });
    await rezultati.send({ embeds: [e] });
    console.log('OK rezultati');
  }

  // ── FAQ ──
  if (faq) {
    await purge(faq);
    const e = kgEmbed({
      title: 'White lista — često postavljana pitanja',
      banner: true,
      color: STYLE.primary,
      description: 'Pre nego što pitaš u <#' + (info?.id ?? '0') + '>, proveri ovde.',
      fields: [
        { name: 'Koliko traje provera?', value: '> Prosečno 6-24h. U vikend može i duže.', inline: false },
        { name: 'Šta ako mi odbiju prijavu?', value: '> Dobićeš razlog DM-om. Možeš predati novu **posle 7 dana**.', inline: false },
        { name: 'Mogu li da budem lažni "doseljenik" ili pseudonim?', value: '> Da, ali stavi i pravo IRL ime u "Ime i prezime" polje (samo za admine, neće biti javno).', inline: false },
        { name: 'Da li je obavezan mikrofon?', value: '> Preporučen, nije obavezan. Ali bez mikrofona nećeš moći da pristupiš svim org/javnim radio frekvencijama.', inline: false },
        { name: 'Koliko godina je minimum?', value: '> **14**. Mlađi mogu po izuzetku — kontaktiraj GM kroz `/ticket`.', inline: false },
        { name: 'Ne razumem IC/OOC?', value: '> **IC** = In Character, ono što tvoj lik radi/zna u igri. **OOC** = Out Of Character, ti kao igrač. Sve van igre (Discord, ulazak u igru, žalba) je OOC.', inline: false },
        { name: 'Mogu li da promenim odgovore posle predaje?', value: '> Ne kroz formu. Otvori `/ticket` (kategorija **White lista**) i objasni izmenu.', inline: false },
        { name: 'Da li je prijava na engleskom OK?', value: '> Ne — odgovori treba da budu na **srpskom/bosanskom/hrvatskom**.', inline: false },
      ],
      footer: 'Sva ostala pitanja idu kroz /ticket (kategorija White lista)',
      guild,
    });
    await faq.send({ embeds: [e] });
    console.log('OK FAQ');
  }

  console.log('\nDONE');
  await c.destroy();
  process.exit(0);
});

await c.login(process.env.DISCORD_TOKEN);
