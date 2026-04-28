// Centralni stil za sve bot embed-ove (KG Balkan RP look & feel)

import { EmbedBuilder, Guild, ColorResolvable, APIEmbedField } from 'discord.js';

export const STYLE = {
  primary:  0x5865F2,
  success:  0x57F287,
  warning:  0xFEE75C,
  danger:   0xED4245,
  info:     0x3498DB,
  brand:    0xFEE75C,
  pink:     0xC15F3C,
  purple:   0x8E44AD,
  cyan:     0x1ABC9C,
  orange:   0xE67E22,
  black:    0x000000,
} as const;

export const DIV = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
export const SUB = '─────────────────────────────';

const NUMS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
const MEDALS = ['🥇', '🥈', '🥉', '🏅', '🏅', '🏅', '🏅', '🏅', '🏅', '🏅'];

export interface KgEmbedOpts {
  title: string;
  description?: string;
  color?: ColorResolvable;
  fields?: APIEmbedField[];
  footer?: string;
  thumbnail?: string | null;
  image?: string | null;
  guild?: Guild | null | undefined;
  author?: { name: string; iconURL?: string };
  timestamp?: boolean;
  banner?: boolean;
  url?: string;
}

/**
 * Glavni stil embed-a za sve bot poruke.
 * banner=true → naslov dobija "░▒▓█  TITLE  █▓▒░" wrapper
 * Default thumbnail = ikonica gildara (ako pass-uješ guild)
 * Footer default: "KG Balkan RP" + ikona gildara
 */
export function kgEmbed(opts: KgEmbedOpts): EmbedBuilder {
  const e = new EmbedBuilder().setColor(opts.color ?? STYLE.primary);

  const title = opts.banner ? `░▒▓█  ${opts.title.toUpperCase()}  █▓▒░` : opts.title;
  e.setTitle(title);
  if (opts.url) e.setURL(opts.url);

  if (opts.description) e.setDescription(opts.description);
  if (opts.fields?.length) e.addFields(opts.fields);
  if (opts.author) e.setAuthor(opts.author);
  if (opts.image) e.setImage(opts.image);

  const thumb = opts.thumbnail ?? opts.guild?.iconURL({ size: 256 }) ?? null;
  if (thumb !== null) e.setThumbnail(thumb);

  const footerText = opts.footer ?? 'KG Balkan RP';
  const footerIcon = opts.guild?.iconURL({ size: 64 }) ?? undefined;
  e.setFooter({ text: footerText, iconURL: footerIcon });

  if (opts.timestamp !== false) e.setTimestamp();

  return e;
}

/** "`①` **Naslov**\n> Opis" pattern za step liste */
export function steps(items: Array<[string, string]>): string {
  return items.map(([title, body], i) => `\`${NUMS[i] ?? `${i + 1}.`}\` **${title}**\n> ${body}`).join('\n\n');
}

/** Top-N lista sa medaljama */
export function rankList<T>(items: T[], render: (item: T, idx: number) => string): string {
  return items.map((it, i) => `${MEDALS[i] ?? `**${i + 1}.**`} ${render(it, i)}`).join('\n');
}

/** Progress bar 20 karaktera, vrednosti 0..1 */
export function progressBar(pct: number, length = 20): string {
  const filled = Math.round(Math.max(0, Math.min(1, pct)) * length);
  return '█'.repeat(filled) + '░'.repeat(length - filled);
}

/** Bullet list sa `> •` quote stilom */
export function bullets(items: string[]): string {
  return items.map(s => `> • ${s}`).join('\n');
}

/** Field helper sa default-om inline=false */
export function field(name: string, value: string, inline = false): APIEmbedField {
  return { name, value, inline };
}

/** Section heading u description-u: ### + bold + nova linija */
export function section(title: string, body: string): string {
  return `### ${title}\n${body}`;
}
