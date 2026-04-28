import { Events, Interaction, MessageFlags, GuildMemberRoleManager } from 'discord.js';

export const name = Events.InteractionCreate;

export async function execute(interaction: Interaction) {
  // Slash commands
  if (interaction.isChatInputCommand()) {
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
    return;
  }

  // Buttons
  if (interaction.isButton()) {
    const cid = interaction.customId;
    if (!interaction.guild || !interaction.member) return;
    const roles = interaction.member.roles as GuildMemberRoleManager;

    if (cid.startsWith('role:') || cid.startsWith('verify:')) {
      const roleId = cid.split(':')[1];
      const role = await interaction.guild.roles.fetch(roleId).catch(() => null);
      if (!role) {
        await interaction.reply({ content: 'Rola više ne postoji.', flags: MessageFlags.Ephemeral });
        return;
      }
      try {
        if (roles.cache.has(roleId)) {
          await roles.remove(role);
          await interaction.reply({ content: `➖ Uklonjena rola **${role.name}**.`, flags: MessageFlags.Ephemeral });
        } else {
          await roles.add(role);
          await interaction.reply({ content: `➕ Dodata rola **${role.name}**.`, flags: MessageFlags.Ephemeral });
        }
      } catch {
        await interaction.reply({ content: 'Bot nema permisiju da menja ovu rolu.', flags: MessageFlags.Ephemeral });
      }
      return;
    }

    if (cid.startsWith('welcome:')) {
      const map: Record<string, string> = {
        rules: 'Pročitaj <#1496653451604529425> (Pravila servera) i <#1496653452946702397> (RP pravila).',
        verify: 'Idi u <#1496653445665390724> i klikni **Verifikuj se**.',
        roles: 'Idi u <#1496653448265863320> i izaberi rolu klikom na dugme.',
      };
      await interaction.reply({ content: map[cid.split(':')[1]] ?? 'Nepoznato', flags: MessageFlags.Ephemeral });
      return;
    }
  }
}
