import 'dotenv/config';
import { Client, GatewayIntentBits, Events, ChannelType, CategoryChannel } from 'discord.js';

const c = new Client({ intents: [GatewayIntentBits.Guilds] });

c.once(Events.ClientReady, async () => {
  const guild = await c.guilds.fetch(process.env.GUILD_ID!).then(g => g.fetch());
  const channels = await guild.channels.fetch();

  // Sve "POMOC" kategorije
  const pomocCats = [...channels.values()].filter(
    ch => ch?.type === ChannelType.GuildCategory && /ᴘᴏᴍᴏᴄ|pomoc/i.test(ch.name),
  ) as CategoryChannel[];

  console.log(`Pronađeno ${pomocCats.length} "ᴘᴏᴍᴏᴄ" kategorija:`);
  for (const cat of pomocCats) {
    const children = [...channels.values()].filter(c => c && (c as any).parentId === cat.id);
    console.log(`  - ${cat.name} (${cat.id}, kreiran ${cat.createdAt?.toISOString()}) — ${children.length} dece`);
    for (const ch of children) console.log(`      • ${ch?.name} (${ch?.type === ChannelType.GuildVoice ? 'voice' : 'text'})`);
  }

  // Strategija: zadrži NAJMLAĐU (jer je to ona sa voice + ticket panel)
  // Izbriši starije sa text Pomoc-1/2/3
  pomocCats.sort((a, b) => (b.createdTimestamp ?? 0) - (a.createdTimestamp ?? 0));
  const keep = pomocCats[0];
  const remove = pomocCats.slice(1);

  console.log(`\nZadržavam: ${keep.name} (${keep.id})`);
  for (const cat of remove) {
    const children = [...channels.values()].filter(c => c && (c as any).parentId === cat.id);
    console.log(`Brišem: ${cat.name} (${cat.id})`);
    for (const ch of children) {
      if (ch) {
        console.log(`  - delete ${ch.name}`);
        await ch.delete('dedupe').catch(e => console.log(`    fail: ${e.message}`));
      }
    }
    await cat.delete('dedupe').catch(e => console.log(`  cat delete fail: ${e.message}`));
  }

  console.log('\nDONE');
  await c.destroy();
  process.exit(0);
});

await c.login(process.env.DISCORD_TOKEN);
