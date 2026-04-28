import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags,
} from 'discord.js';

const SYSTEM_PROMPT = `Ti si Claude assistant integrisan u Discord bot KG Balkan RP servera.
Korisnik te dispatch-uje sa telefona ili Discord-a. Daj kratke, jasne odgovore na srpskom (ekavica).
Ako pita za kod, daj radan primer. Ako pita o serveru, podseti ga da je ovo nezavisna sesija — bez konteksta lokalnog Claude Code-a na PC-u.`;

export const data = new SlashCommandBuilder()
  .setName('claude')
  .setDescription('Postavi pitanje Claude AI (dispatch sa telefona)')
  .addStringOption(o =>
    o.setName('prompt').setDescription('Šta želiš da pitaš').setRequired(true).setMaxLength(2000),
  )
  .addStringOption(o =>
    o.setName('model').setDescription('Model (default: sonnet)').setRequired(false).addChoices(
      { name: 'Haiku (najbrži, najjeftiniji)', value: 'claude-haiku-4-5' },
      { name: 'Sonnet (default, balanced)', value: 'claude-sonnet-4-5' },
      { name: 'Opus (najpametniji, sporiji)', value: 'claude-opus-4-5' },
    ),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    await interaction.reply({
      content: '⚠️ `ANTHROPIC_API_KEY` nije postavljen u `.env`. Admin treba da ga doda iz https://console.anthropic.com/settings/keys.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const prompt = interaction.options.getString('prompt', true);
  const model = interaction.options.getString('model') ?? 'claude-sonnet-4-5';

  await interaction.deferReply();

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      await interaction.editReply({
        content: `❌ API greška (${r.status}): \`${err.slice(0, 200)}\``,
      });
      return;
    }

    const data = await r.json() as any;
    const text = (data.content?.[0]?.text ?? '_(prazan odgovor)_').slice(0, 4000);
    const inputTokens = data.usage?.input_tokens ?? 0;
    const outputTokens = data.usage?.output_tokens ?? 0;

    const e = new EmbedBuilder()
      .setColor(0xc15f3c)
      .setAuthor({ name: `Claude (${model.replace('claude-', '').replace('-4-5', '')})` })
      .setDescription(text.length > 4000 ? text.slice(0, 3997) + '...' : text)
      .setFooter({ text: `${inputTokens} in / ${outputTokens} out tokena` });

    await interaction.editReply({
      content: `**Pitanje:** ${prompt.slice(0, 100)}${prompt.length > 100 ? '…' : ''}`,
      embeds: [e],
    });
  } catch (e: any) {
    await interaction.editReply({
      content: `❌ Greška: ${e?.message ?? 'nepoznato'}`,
    });
  }
}
