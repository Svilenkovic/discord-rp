import 'dotenv/config';
import { Client, GatewayIntentBits, Events, ChannelType } from 'discord.js';

const c = new Client({ intents: [GatewayIntentBits.Guilds] });

c.once(Events.ClientReady, async () => {
  const guild = await c.guilds.fetch(process.env.GUILD_ID!).then(g => g.fetch());
  const channels = await guild.channels.fetch();

  // Pronadji sve sa istim imenom "ᴜᴘᴜᴛꜱᴛᴠᴀ"
  const dupes = [...channels.values()].filter(
    ch => ch?.type === ChannelType.GuildText && /^〔📜〕〢ᴜᴘᴜᴛꜱᴛᴠᴀ$/i.test(ch.name),
  );
  console.log(`Pronadjeno ${dupes.length} sa istim imenom`);

  for (const ch of dupes) {
    if (!ch) continue;
    const parent = (ch as any).parent;
    const parentName = parent?.name ?? '';
    const topic = (ch as any).topic ?? '';

    let newName = '〔📜〕〢ᴜᴘᴜᴛꜱᴛᴠᴀ';
    if (/policija|ᴘᴏʟɪᴄɪᴊᴀ/i.test(parentName) || /policija|ᴘᴏʟɪᴄɪᴊᴀ/i.test(topic)) {
      newName = '〔📜〕〢ᴘᴏʟɪᴄɪᴊᴀ-ᴜᴘᴜᴛꜱᴛᴠᴀ';
    } else if (/bolnica|ʙᴏʟɴɪᴄᴀ|ems/i.test(parentName) || /bolnica|ʙᴏʟɴɪᴄᴀ|ems/i.test(topic)) {
      newName = '〔📜〕〢ʙᴏʟɴɪᴄᴀ-ᴜᴘᴜᴛꜱᴛᴠᴀ';
    } else if (/pravila|ᴘʀᴀᴠɪʟᴀ/i.test(parentName)) {
      newName = '〔📜〕〢ᴜᴘᴜᴛꜱᴛᴠᴀ'; // ostaje
    }

    if (newName !== ch.name) {
      try {
        await ch.setName(newName);
        console.log(`rename (parent=${parentName}): ${ch.id} → ${newName}`);
      } catch (e: any) {
        console.log(`fail ${ch.id}: ${e.message}`);
      }
    } else {
      console.log(`zadržan: ${ch.id} u ${parentName}`);
    }
  }

  console.log('\nDONE');
  await c.destroy();
  process.exit(0);
});

await c.login(process.env.DISCORD_TOKEN);
