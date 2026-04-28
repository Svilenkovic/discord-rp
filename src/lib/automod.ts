// Auto-moderacija: spam, capslock, link blacklist

export interface AutomodConfig {
  blacklistDomains: string[];
  blacklistWords: RegExp[];
  capslockMinLen: number;
  capslockRatio: number; // 0..1
  spamWindowMs: number;
  spamMaxMsgs: number;
}

export const DEFAULT_AUTOMOD: AutomodConfig = {
  blacklistDomains: [
    'discord.gift', 'steamcommun1ty', 'steamcommonity', 'discrod.com',
    'free-nitro', 'nitro-claim', 'discord-nitro', 'gift-nitro',
  ],
  blacklistWords: [
    /\bdiscord\.gift\/[a-z0-9]+\b/i,
    /free\s*nitro/i,
    /\b(?:k(ur|ar)\s*)+\b/i,
  ],
  capslockMinLen: 12,
  capslockRatio: 0.7,
  spamWindowMs: 8000,
  spamMaxMsgs: 5,
};

const recentByUser = new Map<string, number[]>();

export interface AutomodVerdict {
  action: 'none' | 'warn' | 'delete' | 'timeout';
  reason?: string;
  timeoutMs?: number;
}

export function evaluateMessage(
  userId: string,
  content: string,
  cfg: AutomodConfig = DEFAULT_AUTOMOD,
): AutomodVerdict {
  const trimmed = content.trim();
  if (!trimmed) return { action: 'none' };

  // 1. Blacklist domain (link)
  const lower = trimmed.toLowerCase();
  for (const d of cfg.blacklistDomains) {
    if (lower.includes(d)) {
      return { action: 'timeout', reason: `Blacklist link: ${d}`, timeoutMs: 60 * 60 * 1000 };
    }
  }

  // 2. Blacklist regex (npr. nitro scam)
  for (const re of cfg.blacklistWords) {
    if (re.test(trimmed)) {
      return { action: 'delete', reason: 'Blacklist sadržaj' };
    }
  }

  // 3. Capslock
  if (trimmed.length >= cfg.capslockMinLen) {
    const letters = trimmed.replace(/[^A-Za-zŠĐČĆŽšđčćž]/g, '');
    if (letters.length >= cfg.capslockMinLen) {
      const upper = letters.replace(/[^A-ZŠĐČĆŽ]/g, '').length;
      const ratio = upper / letters.length;
      if (ratio > cfg.capslockRatio) {
        return { action: 'delete', reason: `Capslock spam (${Math.round(ratio * 100)}%)` };
      }
    }
  }

  // 4. Brzi spam (više poruka u kratkom prozoru)
  const now = Date.now();
  const arr = (recentByUser.get(userId) ?? []).filter(t => now - t < cfg.spamWindowMs);
  arr.push(now);
  recentByUser.set(userId, arr);
  if (arr.length > cfg.spamMaxMsgs) {
    return { action: 'timeout', reason: `Spam (${arr.length} poruka u ${cfg.spamWindowMs/1000}s)`, timeoutMs: 5 * 60 * 1000 };
  }

  return { action: 'none' };
}
