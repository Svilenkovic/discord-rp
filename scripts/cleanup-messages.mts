import 'dotenv/config';
import { Client, GatewayIntentBits, Events, ChannelType, MessageType, TextChannel } from 'discord.js';

const c = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

c.once(Events.ClientReady, async () => {
  const guild = await c.guilds.fetch(process.env.GUILD_ID!);
  const channels = await guild.fetch().then(g => g.channels.fetch());
  
  let totalPinned = 0;
  let totalAutosetup = 0;
  let totalErrors = 0;
  
  const target = /AUTOSETUP_SR_RESTART_OBAVESTENJA_V2/i;
  
  for (const ch of channels.values()) {
    if (!ch || (ch.type !== ChannelType.GuildText && ch.type !== ChannelType.GuildAnnouncement)) continue;
    const tc = ch as TextChannel;
    
    let lastId: string | undefined;
    let pageCount = 0;
    let chPinned = 0;
    let chAutosetup = 0;
    
    while (pageCount < 20) { // do 2000 poruka po kanalu
      try {
        const msgs = await tc.messages.fetch({ limit: 100, before: lastId });
        if (msgs.size === 0) break;
        
        for (const m of msgs.values()) {
          // Pinned system poruke
          if (m.type === MessageType.ChannelPinnedMessage) {
            try { await m.delete(); chPinned++; totalPinned++; }
            catch (e: any) { totalErrors++; console.log(`  ! delete fail (pinned) ${m.id}: ${e.message}`); }
            continue;
          }
          // AUTOSETUP poruke
          if (target.test(m.content) || m.embeds.some(e => target.test(e.title ?? '') || target.test(e.description ?? ''))) {
            try { await m.delete(); chAutosetup++; totalAutosetup++; }
            catch (e: any) { totalErrors++; console.log(`  ! delete fail (autosetup) ${m.id}: ${e.message}`); }
          }
        }
        
        lastId = msgs.last()?.id;
        if (msgs.size < 100) break;
        pageCount++;
        await new Promise(r => setTimeout(r, 250)); // rate limit safety
      } catch (e: any) {
        if (e.code === 50001) break; // Missing Access — preskoči kanal
        console.log(`  ! fetch fail u #${tc.name}: ${e.message}`);
        break;
      }
    }
    
    if (chPinned > 0 || chAutosetup > 0) {
      console.log(`#${tc.name}: -${chPinned} pinned, -${chAutosetup} autosetup`);
    }
  }
  
  console.log(`\nUKUPNO: ${totalPinned} pinned obrisano, ${totalAutosetup} autosetup obrisano, ${totalErrors} grešaka`);
  
  await c.destroy();
  process.exit(0);
});

await c.login(process.env.DISCORD_TOKEN);
