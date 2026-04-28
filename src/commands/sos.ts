import {
  SlashCommandBuilder, ChatInputCommandInteraction, ChannelType, TextChannel, VoiceChannel,
  MessageFlags,
} from 'discord.js';
import { kgEmbed, STYLE } from '../lib/embedStyle.js';

const SOS_REGEX = /pomoc|pomoć|sos/i;
const SUPPORT_ROLE = '1496653419811704832';

export const data = new SlashCommandBuilder()
  .setName('sos')
  .setDescription('Hitno pozovi tim podrške u prvi slobodan SOS voice kanal')
  .addStringOption(o => o.setName('problem').setDescription('Šta se desilo?').setRequired(true).setMaxLength(300));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return;
  const problem = interaction.options.getString('problem', true);

  const channels = await interaction.guild.channels.fetch();
  const sosVoice = [...channels.values()]
    .filter(c => c?.type === ChannelType.GuildVoice && SOS_REGEX.test(c.name))
    .sort((a, b) => (a as VoiceChannel).members.size - (b as VoiceChannel).members.size) as VoiceChannel[];
  const ticketCh = [...channels.values()].find(
    c => c?.type === ChannelType.GuildText && /otvori-ticket|ᴏᴛᴠᴏʀɪ-ᴛɪᴄᴋᴇᴛ/i.test(c.name),
  ) as TextChannel | undefined;

  if (sosVoice.length === 0) {
    await interaction.reply({ content: 'SOS voice kanali još nisu postavljeni. Otvori ticket umesto toga.', flags: MessageFlags.Ephemeral });
    return;
  }

  const target = sosVoice[0]; // najmanje popunjen

  const e = kgEmbed({
    title: 'SOS poziv',
    banner: true,
    color: STYLE.danger,
    description: `<@${interaction.user.id}> traži hitnu pomoć:\n> ${problem}`,
    author: { name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() },
    fields: [
      { name: 'Voice soba', value: `<#${target.id}>`, inline: true },
      { name: 'Tim', value: `<@&${SUPPORT_ROLE}>`, inline: true },
    ],
    footer: 'Pridruži se voice kanalu — tim podrške dolazi',
    guild: interaction.guild,
  });

  // Ako postoji "otvori-ticket" kanal, šaljemo tamo (vidi ga support tim)
  if (ticketCh) {
    await ticketCh.send({ content: `<@&${SUPPORT_ROLE}>`, embeds: [e] });
  } else {
    // fallback: šalji u prvi text kanal u SOS kategoriji
    const cat = (target as any).parent;
    const parentCh = cat ? [...channels.values()].find(c => c?.type === ChannelType.GuildText && (c as any).parentId === cat.id) as TextChannel | undefined : undefined;
    if (parentCh) await parentCh.send({ content: `<@&${SUPPORT_ROLE}>`, embeds: [e] });
  }

  await interaction.reply({
    content: `✅ Tim je obavešten. Pridruži se: <#${target.id}>`,
    flags: MessageFlags.Ephemeral,
  });
}
