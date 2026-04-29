// Briše: WL kategoriju + sve kanale, Pravila kategoriju (sve ide na sajt),
// redundantne prijave kanale, "Tim bele liste" rolu
// Stilizuje voice Pomoć kanale.

import 'dotenv/config';
import { Client, GatewayIntentBits, Events, ChannelType, CategoryChannel } from 'discord.js';

const c = new Client({ intents: [GatewayIntentBits.Guilds] });

c.once(Events.ClientReady, async () => {
  const guild = await c.guilds.fetch(process.env.GUILD_ID!).then(g => g.fetch());
  const channels = await guild.channels.fetch();
  let deleted = 0;

  // 1. KATEGORIJE ZA BRISANJE (cele + sva deca)
  const KILL_CATS = [
    /ᴡʜɪᴛᴇ ʟɪꜱᴛᴀ|ʙᴇʟᴀ ʟɪꜱᴛᴀ|whitelist/i,        // White lista (sve)
    /ᴘʀᴀᴠɪʟᴀ\s*«?$|ᴡʜɪᴛᴇʟɪꜱᴛ\s*ɪꜱᴘɪᴛɪᴠᴀɴᴊᴇ/i,    // » 📘 ᴘʀᴀᴠɪʟᴀ « + Whitelist ispitivanje
  ];
  const kCats = [...channels.values()].filter(
    ch => ch?.type === ChannelType.GuildCategory && KILL_CATS.some(re => re.test(ch.name)),
  ) as CategoryChannel[];

  for (const cat of kCats) {
    console.log(`\n=== brišem kategoriju: ${cat.name} ===`);
    const children = [...channels.values()].filter(c => c && (c as any).parentId === cat.id);
    for (const ch of children) {
      if (!ch) continue;
      try {
        console.log(`  - ${ch.name}`);
        await ch.delete('cleanup: pravila/wl idu na sajt');
        deleted++;
      } catch (e: any) {
        console.log(`    fail: ${e.message}`);
      }
    }
    try {
      await cat.delete('cleanup');
      console.log(`  ✓ kategorija obrisana`);
    } catch (e: any) {
      console.log(`  cat fail: ${e.message}`);
    }
  }

  // 2. POJEDINAČNI REDUNDANTNI KANALI (van obrisanih kategorija)
  const KILL_CHANNEL_NAMES = [
    /ᴀᴅᴍɪɴ-ᴘʀɪᴊᴀᴠᴇ$/i,           // van Prijave kategorije ima stari "admin-prijave" — kroz tiket
    /ᴘᴏʟɪᴄɪᴊᴀ-ᴘʀɪᴊᴀᴠᴇ/i,         // policija prijave — kroz tiket
    /ʙᴏʟɴɪᴄᴀ-ᴘʀɪᴊᴀᴠᴇ/i,          // bolnica prijave — kroz tiket
    /ʙᴜɢ-ᴘʀɪᴊᴀᴠᴇ-ʙᴇᴛᴀ/i,         // bug prijave — kroz tiket
    /ᴡʟ-ᴀᴅᴍɪɴ-ᴘʀɪᴊᴀᴠᴀ/i,         // wl admin — uklonjeno
    /ᴡʜɪᴛᴇ-ʟɪꜱᴛᴀ/i,              // bilo koji preostali wl kanal
  ];

  const fresh = await guild.channels.fetch();
  for (const ch of fresh.values()) {
    if (!ch) continue;
    if (ch.type !== ChannelType.GuildText) continue;
    if (KILL_CHANNEL_NAMES.some(re => re.test(ch.name))) {
      try {
        console.log(`del kanal: ${ch.name}`);
        await ch.delete('cleanup');
        deleted++;
      } catch (e: any) {
        console.log(`  fail: ${e.message}`);
      }
    }
  }

  // 3. STILIZUJ voice Pomoć
  const reFresh = await guild.channels.fetch();
  for (const ch of reFresh.values()) {
    if (!ch || ch.type !== ChannelType.GuildVoice) continue;
    const m = ch.name.match(/^🆘\s*Pomoć\s*(\d)$/);
    if (m) {
      const newName = `〔🆘〕〢ᴘᴏᴍᴏᴄ-${m[1]}`;
      try {
        await ch.setName(newName);
        console.log(`voice rename: ${ch.name} → ${newName}`);
      } catch {}
    }
  }

  // 4. ROLA "Tim bele liste"
  try {
    const role = await guild.roles.fetch('1496653421422448662');
    if (role) {
      console.log(`brišem rolu: ${role.name}`);
      await role.delete('cleanup: nema vise WL');
    }
  } catch (e: any) {
    console.log(`role fail: ${e.message}`);
  }

  console.log(`\nDONE — obrisano ${deleted} kanala`);
  await c.destroy();
  process.exit(0);
});

await c.login(process.env.DISCORD_TOKEN);
