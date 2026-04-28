import { Events, Client } from 'discord.js';

export const name = Events.ClientReady;
export const once = true;

export function execute(client: Client) {
  console.log(`[ready] Logged in as ${client.user!.tag} (id: ${client.user!.id})`);
  console.log(`[ready] Guilds: ${client.guilds.cache.size}`);
  for (const g of client.guilds.cache.values()) {
    console.log(`[ready]   - ${g.id}  ${g.name}`);
  }
}
