import 'dotenv/config';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.DISCORD_TOKEN) {
  console.error('[fatal] DISCORD_TOKEN missing in .env');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Custom field for command registry (stored on client for handlers)
(client as any).commands = new Collection();

// Load commands
const commandsDir = join(__dirname, 'commands');
for (const file of readdirSync(commandsDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'))) {
  const mod = await import(pathToFileURL(join(commandsDir, file)).href);
  if (mod.data?.name && typeof mod.execute === 'function') {
    (client as any).commands.set(mod.data.name, mod);
  } else {
    console.warn(`[skip] command ${file} missing data/execute`);
  }
}

// Load events
const eventsDir = join(__dirname, 'events');
for (const file of readdirSync(eventsDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'))) {
  const mod = await import(pathToFileURL(join(eventsDir, file)).href);
  if (!mod.name || typeof mod.execute !== 'function') {
    console.warn(`[skip] event ${file} missing name/execute`);
    continue;
  }
  if (mod.once) {
    client.once(mod.name, (...args: any[]) => mod.execute(...args, client));
  } else {
    client.on(mod.name, (...args: any[]) => mod.execute(...args, client));
  }
}

await client.login(process.env.DISCORD_TOKEN);
