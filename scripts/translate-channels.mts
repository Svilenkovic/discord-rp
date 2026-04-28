// Prevod kanala/kategorija sa hrvatskog/regionalnog na srpski (ekavica).
// Skenira sva imena kanala/kategorija i menja po listi pravila.

import 'dotenv/config';
import { Client, GatewayIntentBits, Events } from 'discord.js';

// Pravila: [pattern, novi_naziv_ili_funkcija]
// Pattern matchuje TAČNO ime kanala (case-insensitive). Novi naziv zamenjuje.
const RENAMES: Array<[RegExp, string]> = [
  // upute → uputstva
  [/ᴜᴘᴜᴛᴇ$/i, '〔📜〕〢ᴜᴘᴜᴛꜱᴛᴠᴀ'],
  [/^〔📄〕〢ᴜᴘᴜᴛᴇ$/i, '〔📄〕〢ᴜᴘᴜᴛꜱᴛᴠᴀ'],
];

// Word-level rename u imenu (ne celo ime, samo deo)
const SUBS: Array<[RegExp, string]> = [
  [/ᴜᴘᴜᴛᴇ/g, 'ᴜᴘᴜᴛꜱᴛᴠᴀ'],
  [/upute/gi, 'uputstva'],
  // hr → sr česti slučajevi
  [/sutkinj/gi, 'sudij'],
  [/tjedn/gi, 'nedeljn'],
  [/posto/g, 'posto'], // OK, oba imaju
];

const c = new Client({ intents: [GatewayIntentBits.Guilds] });

c.once(Events.ClientReady, async () => {
  const guild = await c.guilds.fetch(process.env.GUILD_ID!).then(g => g.fetch());
  const channels = await guild.channels.fetch();

  let renamed = 0;
  for (const ch of channels.values()) {
    if (!ch) continue;
    let newName = ch.name;
    for (const [re, full] of RENAMES) {
      if (re.test(ch.name)) { newName = full; break; }
    }
    if (newName === ch.name) {
      // Pokušaj substring zamene
      for (const [re, repl] of SUBS) {
        newName = newName.replace(re, repl);
      }
    }
    if (newName !== ch.name) {
      try {
        const oldName = ch.name;
        await ch.setName(newName);
        renamed++;
        console.log(`rename: ${oldName} → ${newName}`);
      } catch (e: any) {
        console.log(`fail ${ch.name}: ${e.message}`);
      }
    }
  }

  console.log(`\nDONE — renamed ${renamed}`);
  await c.destroy();
  process.exit(0);
});

await c.login(process.env.DISCORD_TOKEN);
