import 'dotenv/config';
import { Client, GatewayIntentBits, Events, ChannelType } from 'discord.js';

const c = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

c.once(Events.ClientReady, async () => {
  const guild = await c.guilds.fetch(process.env.GUILD_ID!);
  const fetched = await guild.fetch();
  console.log(`SERVER: ${fetched.name} (${fetched.id})`);
  console.log(`MEMBERS: ${fetched.memberCount}`);
  console.log(`OWNER: ${fetched.ownerId}`);

  const roles = await fetched.roles.fetch();
  console.log(`\nROLES (${roles.size}):`);
  for (const r of roles.values()) {
    if (r.id === fetched.id) continue; // skip @everyone
    console.log(`  ${r.position.toString().padStart(2)}. ${r.name} (${r.id}) — color #${r.color.toString(16).padStart(6,'0')}, mentionable=${r.mentionable}, members=${r.members.size}`);
  }

  const channels = await fetched.channels.fetch();
  console.log(`\nCHANNELS (${channels.size}):`);
  const cats = new Map<string, string>();
  for (const ch of channels.values()) {
    if (ch?.type === ChannelType.GuildCategory) cats.set(ch.id, ch.name);
  }
  const grouped = new Map<string, any[]>();
  for (const ch of channels.values()) {
    if (!ch || ch.type === ChannelType.GuildCategory) continue;
    const catId = (ch as any).parentId ?? '__none';
    if (!grouped.has(catId)) grouped.set(catId, []);
    grouped.get(catId)!.push(ch);
  }
  for (const [catId, list] of grouped) {
    console.log(`  [${cats.get(catId) ?? '(no category)'}]`);
    for (const ch of list.sort((a:any,b:any)=>a.position - b.position)) {
      const t = ch.type === ChannelType.GuildText ? '#' : ch.type === ChannelType.GuildVoice ? '🔊' : ch.type === ChannelType.GuildAnnouncement ? '📢' : ch.type === ChannelType.GuildForum ? '💬' : '?';
      console.log(`    ${t} ${ch.name} (${ch.id}, type=${ChannelType[ch.type]})`);
    }
  }

  await c.destroy();
  process.exit(0);
});

await c.login(process.env.DISCORD_TOKEN);
