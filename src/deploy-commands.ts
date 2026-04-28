import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  console.error('[fatal] DISCORD_TOKEN i CLIENT_ID moraju biti u .env');
  process.exit(1);
}

const commands: any[] = [];
const dir = join(__dirname, 'commands');
for (const file of readdirSync(dir).filter(f => f.endsWith('.ts') || f.endsWith('.js'))) {
  const mod = await import(pathToFileURL(join(dir, file)).href);
  if (mod.data?.toJSON) commands.push(mod.data.toJSON());
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);
const route = process.env.GUILD_ID
  ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
  : Routes.applicationCommands(process.env.CLIENT_ID);

const data = await rest.put(route, { body: commands });
const scope = process.env.GUILD_ID ? `guild ${process.env.GUILD_ID}` : 'globally';
console.log(`Successfully reloaded ${(data as any[]).length} application (/) commands ${scope}.`);
