import { Events, Interaction, MessageFlags } from 'discord.js';

export const name = Events.InteractionCreate;

export async function execute(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;

  const cmd = (interaction.client as any).commands.get(interaction.commandName);
  if (!cmd) {
    console.warn(`[interaction] unknown command: ${interaction.commandName}`);
    return;
  }

  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error(`[interaction] error in ${interaction.commandName}:`, err);
    const reply = { content: 'Greška pri izvršavanju komande.', flags: MessageFlags.Ephemeral };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
}
