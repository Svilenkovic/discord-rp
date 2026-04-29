import 'dotenv/config';
import {
  Client, GatewayIntentBits, Events, ChannelType, PermissionFlagsBits,
  EmbedBuilder, TextChannel, CategoryChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle,
} from 'discord.js';

const SUPPORT_ROLE = '1496653419811704832';

const c = new Client({ intents: [GatewayIntentBits.Guilds] });

c.once(Events.ClientReady, async () => {
  const guild = await c.guilds.fetch(process.env.GUILD_ID!).then(g => g.fetch());
  const channels = await guild.channels.fetch();

  // Pronadji "ᴘᴏᴍᴏᴄ" kategoriju
  const cat = [...channels.values()].find(
    ch => ch?.type === ChannelType.GuildCategory && /pomoc|ᴘᴏᴍᴏᴄ/i.test(ch.name),
  ) as CategoryChannel | undefined;

  if (!cat) {
    console.log('Kategorija nije pronađena.');
    process.exit(1);
  }

  // Brišem stare text kanale "ᴘᴏᴍᴏᴄ-1/2/3"
  const old = [...channels.values()].filter(
    ch => ch?.type === ChannelType.GuildText && /ᴘᴏᴍᴏᴄ-\d/i.test(ch.name) && (ch as any).parentId === cat.id,
  );
  console.log(`Brišem ${old.length} starih text Pomoc kanala...`);
  for (const ch of old) {
    if (ch) await ch.delete('zamena za voice').catch(() => {});
  }

  // Kreiram 3 VOICE kanala (pravi format odmah)
  for (let i = 1; i <= 3; i++) {
    const name = `〔🆘〕〢ᴘᴏᴍᴏᴄ-${i}`;
    const altName = `🆘 Pomoć ${i}`;
    const exists = [...channels.values()].find(ch => ch && ch.type === ChannelType.GuildVoice && (ch.name === name || ch.name === altName));
    if (exists) {
      // ako je u starom formatu, rename
      if (exists.name === altName) {
        try { await exists.setName(name); console.log(`rename voice → ${name}`); } catch {}
      }
      continue;
    }
    await guild.channels.create({
      name,
      type: ChannelType.GuildVoice,
      parent: cat.id,
      userLimit: 5,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, allow: [PermissionFlagsBits.Connect] },
        { id: SUPPORT_ROLE, allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.MoveMembers, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers] },
      ],
    });
    console.log(`+ voice ${name}`);
  }

  // Kreiram TEXT kanal "otvori-ticket"
  const ticketChName = '〔🎫〕〢ᴏᴛᴠᴏʀɪ-ᴛɪᴄᴋᴇᴛ';
  let ticketCh = [...channels.values()].find(ch => ch?.name === ticketChName) as TextChannel | undefined;
  if (!ticketCh) {
    ticketCh = await guild.channels.create({
      name: ticketChName,
      type: ChannelType.GuildText,
      parent: cat.id,
      topic: 'Otvori ticket sa kategorijom — klikni dugme ispod',
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.SendMessages] },
        { id: SUPPORT_ROLE, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] },
        { id: c.user!.id, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks] },
      ],
    }) as TextChannel;
    console.log(`+ text ${ticketChName}`);
  }

  // Postavi ticket panel
  // (purge old)
  let last: string | undefined;
  while (true) {
    const msgs = await ticketCh.messages.fetch({ limit: 100, before: last });
    if (msgs.size === 0) break;
    const young = msgs.filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 3600 * 1000);
    if (young.size > 1) await ticketCh.bulkDelete(young, true).catch(() => {});
    else for (const m of young.values()) try { await m.delete(); } catch {}
    last = msgs.last()?.id;
    if (msgs.size < 100) break;
  }

  const { kgEmbed, STYLE } = await import('../src/lib/embedStyle.js');
  const embed = kgEmbed({
    title: 'Otvori ticket',
    banner: true,
    color: STYLE.primary,
    description: 'Sve prijave i pitanja idu kroz tikete — izaberi kategoriju klikom na dugme.\nOtvoriće se privatan kanal sa odgovarajućim timom.',
    fields: [
      { name: '🆘 Pomoć',          value: '> Opšte pitanje ili hitna situacija',       inline: true },
      { name: '🚨 Prijava igrača', value: '> Igrač krši pravila / RP-break / cheat',   inline: true },
      { name: '🔓 Žalba na ban',   value: '> Misliš da si banovan nepravedno',         inline: true },
      { name: '⚖️ Žalba na admina', value: '> Admin nije pravilno postupio',           inline: true },
      { name: '🐛 Prijava buga',   value: '> Greška u igri / na serveru',              inline: true },
      { name: '💎 Donacija',       value: '> Pitanja oko donacija i paketa',           inline: true },
      { name: '🤝 Saradnja',       value: '> Predlog, saradnja, ostalo',               inline: true },
    ],
    footer: 'Ne otvaraj duplikate — admin tim će ti odgovoriti u 24h',
    guild,
  });

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('tcat:pomoc').setLabel('Pomoć').setEmoji('🆘').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('tcat:prijava-igraca').setLabel('Prijava igrača').setEmoji('🚨').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('tcat:zalba-ban').setLabel('Žalba na ban').setEmoji('🔓').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('tcat:zalba').setLabel('Žalba na admina').setEmoji('⚖️').setStyle(ButtonStyle.Danger),
  );
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('tcat:bug').setLabel('Bug').setEmoji('🐛').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('tcat:donacija').setLabel('Donacija').setEmoji('💎').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('tcat:ostalo').setLabel('Saradnja').setEmoji('🤝').setStyle(ButtonStyle.Secondary),
  );

  await ticketCh.send({ embeds: [embed], components: [row1, row2] });
  console.log('OK ticket panel');

  console.log('\nDONE');
  await c.destroy();
  process.exit(0);
});

await c.login(process.env.DISCORD_TOKEN);
