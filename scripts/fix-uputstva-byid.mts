import 'dotenv/config';
import { Client, GatewayIntentBits, Events, ChannelType } from 'discord.js';

const c = new Client({ intents: [GatewayIntentBits.Guilds] });

c.once(Events.ClientReady, async () => {
  const guild = await c.guilds.fetch(process.env.GUILD_ID!).then(g => g.fetch());
  const channels = await guild.channels.fetch();

  const dupes = [...channels.values()]
    .filter(ch => ch?.type === ChannelType.GuildText && /^〔📜〕〢ᴜᴘᴜᴛꜱᴛᴠᴀ$/i.test(ch.name))
    .filter(ch => /ᴅʀᴢᴀᴠɴᴇ|sluzbe/i.test(((ch as any).parent?.name) ?? ''))
    .sort((a, b) => a!.id.localeCompare(b!.id));

  console.log(`U DRZAVNE SLUZBE kategoriji: ${dupes.length}`);
  if (dupes.length >= 2) {
    await dupes[0]!.setName('〔📜〕〢ᴘᴏʟɪᴄɪᴊᴀ-ᴜᴘᴜᴛꜱᴛᴠᴀ').catch(() => {});
    console.log(`rename: ${dupes[0]!.id} → POLICIJA`);
    await dupes[1]!.setName('〔📜〕〢ʙᴏʟɴɪᴄᴀ-ᴜᴘᴜᴛꜱᴛᴠᴀ').catch(() => {});
    console.log(`rename: ${dupes[1]!.id} → BOLNICA`);
  }
  console.log('DONE');
  await c.destroy();
  process.exit(0);
});

await c.login(process.env.DISCORD_TOKEN);
