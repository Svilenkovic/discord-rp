import { Events, Interaction, MessageFlags, GuildMemberRoleManager, ActionRowBuilder } from 'discord.js';

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
        await interaction.reply({ content: 'Uloga više ne postoji.', flags: MessageFlags.Ephemeral });
        return;
      }
      try {
        if (roles.cache.has(roleId)) {
          await roles.remove(role);
          await interaction.reply({ content: `➖ Uklonjena ti je uloga **${role.name}**.`, flags: MessageFlags.Ephemeral });
        } else {
          await roles.add(role);
          await interaction.reply({ content: `➕ Dodeljena ti je uloga **${role.name}**.`, flags: MessageFlags.Ephemeral });
        }
      } catch {
        await interaction.reply({ content: 'Bot nema dozvolu da menja ovu ulogu (njegova uloga mora biti iznad).', flags: MessageFlags.Ephemeral });
      }
      return;
    }

    if (cid.startsWith('welcome:')) {
      const map: Record<string, string> = {
        rules: 'Pročitaj <#1496653451604529425> (Pravila servera) i <#1496653452946702397> (RP pravila).',
        verify: 'Idi u <#1496653445665390724> i klikni **Verifikuj se**.',
        roles: 'Idi u <#1496653448265863320> i izaberi ulogu klikom na dugme.',
      };
      await interaction.reply({ content: map[cid.split(':')[1]] ?? 'Nepoznato', flags: MessageFlags.Ephemeral });
      return;
    }

    // Ticket buttons: ticket:close
    if (cid === 'ticket:close') {
      const ch = interaction.channel;
      if (ch && 'name' in ch && ch.name?.startsWith('ticket-')) {
        await interaction.reply({ content: '🔒 Tiket će biti zatvoren za 5 sekundi…' });
        setTimeout(() => { (ch as any).delete().catch(() => {}); }, 5000);
      } else {
        await interaction.reply({ content: 'Ovaj kanal nije tiket.', flags: MessageFlags.Ephemeral });
      }
      return;
    }

    // Ticket category buttons: tcat:<catId>
    if (cid.startsWith('tcat:')) {
      const { openTicketModal } = await import('../lib/tickets.js');
      await openTicketModal(interaction, cid.split(':')[1]);
      return;
    }

    // Apply buttons: apply:start (otvara modal)
    if (cid === 'apply:start') {
      const { ModalBuilder, TextInputBuilder, TextInputStyle } = await import('discord.js');
      const modal = new ModalBuilder().setCustomId('apply:submit').setTitle('Prijava za belu listu');
      const ime = new TextInputBuilder().setCustomId('ime').setLabel('Ime i prezime (IRL)').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(60);
      const godine = new TextInputBuilder().setCustomId('godine').setLabel('Godine').setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(3);
      const iskustvo = new TextInputBuilder().setCustomId('iskustvo').setLabel('RP iskustvo (kratko)').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(500);
      const lik = new TextInputBuilder().setCustomId('lik').setLabel('Ideja za lika (ime, pozadina)').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(800);
      const razlog = new TextInputBuilder().setCustomId('razlog').setLabel('Zašto baš naš server?').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(400);
      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(ime),
        new ActionRowBuilder<TextInputBuilder>().addComponents(godine),
        new ActionRowBuilder<TextInputBuilder>().addComponents(iskustvo),
        new ActionRowBuilder<TextInputBuilder>().addComponents(lik),
        new ActionRowBuilder<TextInputBuilder>().addComponents(razlog),
      );
      await interaction.showModal(modal);
      return;
    }

    // Application action buttons (admin)
    if (cid.startsWith('apply:approve:') || cid.startsWith('apply:reject:')) {
      const { handleApplicationDecision } = await import('../lib/applications.js');
      await handleApplicationDecision(interaction, cid);
      return;
    }
  }

  // Modal submit
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'apply:submit') {
      const { handleApplicationSubmit } = await import('../lib/applications.js');
      await handleApplicationSubmit(interaction);
      return;
    }
    if (interaction.customId.startsWith('tnew:')) {
      const { createTicketFromModal } = await import('../lib/tickets.js');
      await createTicketFromModal(interaction, interaction.customId.split(':')[1]);
      return;
    }
  }

  // String select (donate paketi)
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'donate:select') {
      const { findPackage } = await import('../lib/donations.js');
      const { kgEmbed, STYLE, bullets, field } = await import('../lib/embedStyle.js');
      const id = interaction.values[0];
      const pkg = findPackage(id);
      if (!pkg) {
        await interaction.reply({ content: 'Paket nije pronađen.', flags: MessageFlags.Ephemeral });
        return;
      }
      const e = kgEmbed({
        title: pkg.name,
        banner: true,
        color: STYLE.brand,
        description: `> **Kategorija:** ${pkg.category}\n> **Cena:** \`${pkg.price}\``,
        fields: [field('Šta dobijaš', bullets(pkg.perks))],
        footer: 'Otvori `/ticket` sa kategorijom Donacija ili kontaktiraj Tim donacija',
        guild: interaction.guild,
      });
      await interaction.reply({ embeds: [e], flags: MessageFlags.Ephemeral });
      return;
    }
  }
}
