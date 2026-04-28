import 'dotenv/config';
import { Client, GatewayIntentBits, Events } from 'discord.js';
const c = new Client({ intents: [GatewayIntentBits.Guilds] });
c.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${c.user!.tag}, found ${c.guilds.cache.size} guilds`);
  for (const g of c.guilds.cache.values()) console.log(`GUILD: ${g.id} ${g.name}`);
  setTimeout(() => process.exit(0), 500);
});
await c.login(process.env.DISCORD_TOKEN);
