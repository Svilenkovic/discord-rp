import 'dotenv/config';
import {
  Client, GatewayIntentBits, Events, ChannelType, PermissionFlagsBits,
  EmbedBuilder, TextChannel, CategoryChannel,
} from 'discord.js';

const SUPPORT_ROLE = '1496653419811704832';

const c = new Client({ intents: [GatewayIntentBits.Guilds] });

c.once(Events.ClientReady, async () => {
  const guild = await c.guilds.fetch(process.env.GUILD_ID!).then(g => g.fetch());
  const channels = await guild.channels.fetch();

  // ── 1. BRIŠEM nepotrebne kanale (patrole + drugi šum) ──
  const deleteRegex = /patrol/i;
  const toDelete = [...channels.values()].filter(ch => ch && deleteRegex.test(ch.name));
  console.log(`Pronađeno ${toDelete.length} kanala za brisanje:`);
  for (const ch of toDelete) {
    if (!ch) continue;
    try {
      console.log(`  - ${ch.name} (${ch.id}, ${ChannelType[ch.type]})`);
      await ch.delete('cleanup: nepotreban patrola/sum kanal').catch(() => {});
    } catch {}
  }

  // ── 2. PRAVIM SOS / Pomoć kategoriju ──
  const existingCategory = [...channels.values()].find(
    ch => ch?.type === ChannelType.GuildCategory && /sos|pomo[čć]/i.test(ch.name),
  ) as CategoryChannel | undefined;

  let cat: CategoryChannel;
  if (existingCategory) {
    console.log(`Postojeća kategorija: ${existingCategory.name}`);
    cat = existingCategory;
  } else {
    cat = await guild.channels.create({
      name: '» 🆘 ᴘᴏᴍᴏᴄ «',
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.SendMessages] },
        { id: SUPPORT_ROLE, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] },
      ],
    });
    console.log(`Kreirana kategorija: ${cat.name}`);
  }

  // ── 3. PRAVIM 3 Pomoć kanala ──
  for (let i = 1; i <= 3; i++) {
    const name = `〔🆘〕〢ᴘᴏᴍᴏᴄ-${i}`;
    const exists = [...channels.values()].find(c => c?.name === name);
    if (exists) {
      console.log(`Postoji već: ${name}`);
      continue;
    }
    const ch = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: cat.id,
      topic: `SOS soba #${i} — Tim podrške odgovara ovde. Pokreni preko \`/sos\` komande.`,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.SendMessages] },
        { id: SUPPORT_ROLE, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] },
        { id: c.user!.id, allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages] },
      ],
    });
    const e = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle(`🆘  Pomoć #${i}`)
      .setDescription([
        'Ovaj kanal je za hitne situacije.',
        '',
        '**Kako da pozoveš pomoć:**',
        '`/sos problem:opisi šta se desilo`',
        '',
        'Tim podrške <@&' + SUPPORT_ROLE + '> će ti odgovoriti ovde.',
      ].join('\n'));
    await ch.send({ embeds: [e] });
    console.log(`Kreiran: ${name}`);
  }

  // ── 4. PRAVIM mod-log kanal ako ne postoji ──
  const existingModLog = [...channels.values()].find(
    ch => ch?.type === ChannelType.GuildText && /mod-log|audit|aᴜᴅɪᴛ|ʟᴏɢ/i.test(ch.name),
  );
  if (!existingModLog) {
    const adminCat = [...channels.values()].find(
      ch => ch?.type === ChannelType.GuildCategory && /admin|stuff|adm/i.test(ch.name),
    ) as CategoryChannel | undefined;

    const log = await guild.channels.create({
      name: '〔📋〕〢ᴍᴏᴅ-ʟᴏɢ',
      type: ChannelType.GuildText,
      parent: adminCat?.id,
      topic: 'Auto-mod, ban, kick, timeout, join/leave audit',
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: SUPPORT_ROLE, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
        { id: '1496653411314172085', allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
        { id: '1496653412014620845', allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
        { id: c.user!.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks] },
      ],
    });
    console.log(`Kreiran mod-log kanal: ${log.name}`);
  }

  console.log('\nDONE');
  await c.destroy();
  process.exit(0);
});

await c.login(process.env.DISCORD_TOKEN);
