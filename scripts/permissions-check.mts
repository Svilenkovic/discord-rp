import 'dotenv/config';
import { Client, GatewayIntentBits, Events, PermissionsBitField } from 'discord.js';

const c = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

c.once(Events.ClientReady, async () => {
  const guild = await c.guilds.fetch(process.env.GUILD_ID!);
  const fetched = await guild.fetch();
  const me = await fetched.members.fetch(c.user!.id);
  const perms = me.permissions;
  
  const checks = [
    'Administrator', 'ManageGuild', 'ManageChannels', 'ManageMessages',
    'ManageRoles', 'KickMembers', 'BanMembers', 'ReadMessageHistory',
    'SendMessages', 'EmbedLinks', 'AttachFiles', 'UseExternalEmojis',
    'ManageWebhooks', 'MentionEveryone', 'ViewChannel'
  ];
  console.log('BOT PERMISSIONS:');
  for (const p of checks) {
    const has = perms.has(PermissionsBitField.Flags[p as keyof typeof PermissionsBitField.Flags]);
    console.log(`  ${has ? '✅' : '❌'} ${p}`);
  }
  
  await c.destroy();
  process.exit(0);
});

await c.login(process.env.DISCORD_TOKEN);
