import 'dotenv/config';
import {
  Client, GatewayIntentBits, Events, ChannelType, EmbedBuilder, TextChannel,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
} from 'discord.js';

const c = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

c.once(Events.ClientReady, async () => {
  const guild = await c.guilds.fetch(process.env.GUILD_ID!).then(g => g.fetch());
  const channels = await guild.channels.fetch();

  const find = (re: RegExp) =>
    [...channels.values()].find(ch => ch && ch.type === ChannelType.GuildText && re.test(ch.name)) as TextChannel | undefined;

  const dobrodosli = find(/dobrodosli|ᴅᴏʙʀᴏᴅᴏꜱʟɪ/i);
  const kakoUlaz   = find(/kako.*udj|ᴋᴀᴋᴏ.*ᴜᴅᴊ/i);
  const verif      = find(/verifikacija|ᴠᴇʀɪꜰɪᴋᴀᴄɪᴊᴀ/i);
  const izborUloga = find(/izbor.*uloga|ɪᴢʙᴏʀ.*ᴜʟᴏɢᴀ/i);

  console.log('Targets:', {
    dobrodosli: dobrodosli?.name, kakoUlaz: kakoUlaz?.name,
    verif: verif?.name, izborUloga: izborUloga?.name,
  });

  async function purge(ch: TextChannel) {
    let last: string | undefined;
    while (true) {
      const msgs = await ch.messages.fetch({ limit: 100, before: last });
      if (msgs.size === 0) break;
      const young = msgs.filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 3600 * 1000);
      const old = msgs.filter(m => Date.now() - m.createdTimestamp >= 14 * 24 * 3600 * 1000);
      if (young.size > 1) {
        await ch.bulkDelete(young, true).catch(() => {});
      } else for (const m of young.values()) {
        try { await m.delete(); } catch {}
      }
      for (const m of old.values()) {
        try { await m.delete(); await new Promise(r => setTimeout(r, 400)); } catch {}
      }
      last = msgs.last()?.id;
      if (msgs.size < 100) break;
    }
  }

  const findId = (re: RegExp) => find(re)?.id ?? '0';

  // ── 1. DOBRODOSLI ──
  if (dobrodosli) {
    await purge(dobrodosli);
    const banner = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('░▒▓█  KG BALKAN RP  █▓▒░')
      .setDescription([
        '## Dobrodošli na **najbalkanskiji** FiveM RP server',
        '',
        '> Realističan roleplay • Ekonomija • Frakcije • Heists • Custom mape',
        '',
        '**Pre nego što počneš:**',
        '`①` Pročitaj <#' + findId(/pravila-servera|ᴘʀᴀᴠɪʟᴀ.*ꜱᴇʀᴠᴇʀᴀ/i) + '>',
        '`②` Verifikuj se u <#' + (verif?.id ?? '0') + '>',
        '`③` Izaberi uloge u <#' + (izborUloga?.id ?? '0') + '>',
        '`④` Predaj prijavu u <#' + findId(/bela-lista-prijava|ʙᴇʟᴀ.*ʟɪꜱᴛᴀ.*ᴘʀɪᴊᴀᴠᴀ/i) + '>',
      ].join('\n'))
      .setThumbnail(guild.iconURL({ size: 256 }) ?? null)
      .setImage(guild.bannerURL({ size: 1024 }) ?? null)
      .setFooter({ text: 'KG Balkan RP • 2026', iconURL: guild.iconURL() ?? undefined });

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('welcome:rules').setLabel('Pravila').setEmoji('📜').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('welcome:verify').setLabel('Verifikuj se').setEmoji('✅').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('welcome:roles').setLabel('Uloge').setEmoji('🎭').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setURL('https://discord.gg/EDqNFmaq5').setLabel('Pozovi').setEmoji('🔗').setStyle(ButtonStyle.Link),
    );

    await dobrodosli.send({ embeds: [banner], components: [buttons] });
    console.log('OK #dobrodosli');
  }

  // ── 2. KAKO-DA-UDJES ──
  if (kakoUlaz) {
    await purge(kakoUlaz);
    const e = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('🚪  Kako da uđeš na server')
      .setDescription([
        '### 1️⃣  Verifikacija',
        'Idi u <#' + (verif?.id ?? '0') + '> i klikni **Verifikuj se**.',
        '',
        '### 2️⃣  Bela lista (Whitelist)',
        'Popuni prijavu u <#' + findId(/ʙᴇʟᴀ.*ʟɪꜱᴛᴀ.*ᴘʀɪᴊᴀᴠᴀ/i) + '>. Tim **Bela Lista** odgovara u 24h.',
        '',
        '### 3️⃣  Connect',
        'Server IP nadjes u <#' + findId(/server-ip|ꜱᴇʀᴠᴇʀ-ɪᴘ/i) + '>. F8 → `connect <ip>`.',
        '',
        '### 4️⃣  Prvi koraci',
        '`/help` u igri • `/character` za RP karakter • `/job` za posao',
      ].join('\n'))
      .setFooter({ text: 'Trebaš pomoć? Tim Podrške.' });
    await kakoUlaz.send({ embeds: [e] });
    console.log('OK #kako-da-udjes');
  }

  // ── 3. VERIFIKACIJA ──
  if (verif) {
    await purge(verif);
    const verifiedRoleId = '1496653430729736344';
    const e = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle('✅  Verifikacija')
      .setDescription([
        'Klikom na dugme prihvataš:',
        '> • Pravila servera <#' + findId(/ᴘʀᴀᴠɪʟᴀ-ꜱᴇʀᴠᴇʀᴀ/i) + '>',
        '> • RP pravila <#' + findId(/ᴘʀᴀᴠɪʟᴀ-ʀᴘ/i) + '>',
        '> • Da nećeš praviti šum, spam i ne-RP situacije',
        '',
        'Posle klika dobijaš rolu **Verifikovani Igrač** i pristup ostalim kanalima.',
      ].join('\n'));
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('verify:' + verifiedRoleId).setLabel('Verifikuj se').setEmoji('✅').setStyle(ButtonStyle.Success),
    );
    await verif.send({ embeds: [e], components: [row] });
    console.log('OK #verifikacija');
  }

  // ── 4. IZBOR-ULOGA ──
  if (izborUloga) {
    await purge(izborUloga);

    const notifRoles: Array<[string, string]> = [
      ['1496659122697928944', '📢 Obaveštenja'],
      ['1496659123817938966', '🎉 Event ping'],
      ['1496659124857864332', '💎 Donacije'],
      ['1496663971992961158', '🚔 Policija'],
      ['1496663975079706706', '🎁 Giveaway'],
      ['1496663976560558180', '📺 Streamer'],
      ['1498439891527405721', '🏴 Organizacije'],
    ];

    const e1 = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🎭  Izbor uloga — Notifikacije')
      .setDescription('Klikni dugme da dobiješ ili skineš rolu. Možeš birati više.');

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      ...notifRoles.slice(0, 4).map(([id, label]) =>
        new ButtonBuilder().setCustomId('role:' + id).setLabel(label).setStyle(ButtonStyle.Secondary),
      ),
    );
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      ...notifRoles.slice(4).map(([id, label]) =>
        new ButtonBuilder().setCustomId('role:' + id).setLabel(label).setStyle(ButtonStyle.Secondary),
      ),
    );
    await izborUloga.send({ embeds: [e1], components: [row1, row2] });

    const e2 = new EmbedBuilder()
      .setColor(0x00B894)
      .setTitle('🧪  Specijalne uloge')
      .setDescription('Pristup beta funkcijama / programer kanalima.');
    const r3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('role:1496812609817673791').setLabel('🧪 Beta Tester').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('role:1498439860506202275').setLabel('💻 Programer').setStyle(ButtonStyle.Primary),
    );
    await izborUloga.send({ embeds: [e2], components: [r3] });
    console.log('OK #izbor-uloga');
  }

  console.log('\nDONE');
  await c.destroy();
  process.exit(0);
});

await c.login(process.env.DISCORD_TOKEN);
