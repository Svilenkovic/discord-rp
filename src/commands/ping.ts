import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Sanity check — bot odgovara sa latencijom.');

export async function execute(interaction: ChatInputCommandInteraction) {
  const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
  const latency = sent.createdTimestamp - interaction.createdTimestamp;
  const wsPing = Math.round(interaction.client.ws.ping);
  await interaction.editReply(`pong! latency: ${latency}ms, websocket: ${wsPing}ms`);
}
