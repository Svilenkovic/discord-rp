// Pravi #strimeri-live kanal i Strimer rolu

import 'dotenv/config';
import {
  Client, GatewayIntentBits, Events, ChannelType, PermissionFlagsBits,
  TextChannel, CategoryChannel,
} from 'discord.js';
import { kgEmbed, STYLE } from '../src/lib/embedStyle.js';

const c = new Client({ intents: [GatewayIntentBits.Guilds] });

c.once(Events.ClientReady, async () => {
  const guild = await c.guilds.fetch(process.env.GUILD_ID!).then(g => g.fetch());

  // 1. Pronadji ili kreiraj Strimer rolu
  let strimerRole = guild.roles.cache.find(r => /^🎥|strimer|streamer/i.test(r.name) && !/notifika/i.test(r.name));
  if (!strimerRole) {
    strimerRole = await guild.roles.create({
      name: '🎥 Strimer',
      color: 0xe84393,
      mentionable: true,
      reason: 'Approved strimer role',
    });
    console.log(`+ rola: ${strimerRole.name}`);
  } else {
    console.log(`postoji rola: ${strimerRole.name}`);
  }

  // 2. Pronadji "Zajednica" kategoriju (ili pravi novu)
  const channels = await guild.channels.fetch();
  let cat = [...channels.values()].find(
    ch => ch?.type === ChannelType.GuildCategory && /zᴀᴊᴇᴅɴɪᴄᴀ|zajednica/i.test(ch.name),
  ) as CategoryChannel | undefined;

  // 3. Pronadji ili kreiraj #strimeri-live kanal
  let liveCh = [...channels.values()].find(
    ch => ch?.type === ChannelType.GuildText && /strimeri-live|ꜱᴛʀɪᴍᴇʀɪ-ʟɪᴠᴇ/i.test(ch.name),
  ) as TextChannel | undefined;

  const STREAMER_PING_ROLE = '1496663976560558180'; // 「 📺 」 Streamer notifikacije

  if (!liveCh) {
    liveCh = await guild.channels.create({
      name: '〔📺〕〢ꜱᴛʀɪᴍᴇʀɪ-ʟɪᴠᴇ',
      type: ChannelType.GuildText,
      parent: cat?.id,
      topic: 'Strimeri kače live linkove ovde — automatski ping za pratioce',
      permissionOverwrites: [
        { id: guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] },
        { id: strimerRole.id, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks] },
        { id: c.user!.id, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] },
      ],
    });
    console.log(`+ kanal: ${liveCh.name}`);
  }

  // 4. Postavi info embed
  let last: string | undefined;
  while (true) {
    const msgs = await liveCh.messages.fetch({ limit: 50, before: last });
    if (msgs.size === 0) break;
    for (const m of msgs.values()) try { await m.delete(); } catch {}
    last = msgs.last()?.id;
    if (msgs.size < 50) break;
  }

  const e = kgEmbed({
    title: 'Strimeri — live objava',
    banner: true,
    color: 0xe84393,
    description: 'Ovaj kanal je za **odobrene strimere** — kače link kad krenu sa live stream-om.',
    fields: [
      { name: 'Kako da postaneš strimer', value: '> Otvori `/ticket` → **Strimer prijava** → popuni formu' },
      { name: 'Šta dobijaš', value: [
        '> • Custom **🎥 Strimer** rolu (ljubičasta boja imena)',
        '> • Pravo da pišeš u ovom kanalu',
        '> • Ping za pratioce strimera (<@&' + STREAMER_PING_ROLE + '>)',
        '> • **10€ kredit po stream-u 5h+**, bonus **15€** za 20+ gledalaca',
      ].join('\n') },
      { name: 'Format objave', value: [
        '> ```',
        '> 🔴 LIVE NA <PLATFORMA>',
        '> Naslov: <šta strimuješ>',
        '> Link: <URL>',
        '> ```',
        '> Bot će automatski pingovati pratioce.',
      ].join('\n') },
    ],
    footer: 'Spam = mute • Reci u tiketu ako imaš pitanja',
    guild,
  });
  await liveCh.send({ embeds: [e] });
  console.log('OK strimeri-live embed');

  console.log('\nDONE');
  await c.destroy();
  process.exit(0);
});

await c.login(process.env.DISCORD_TOKEN);
