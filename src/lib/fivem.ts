// FiveM server info klijent (poziva /info.json i /players.json)

export interface FiveMInfo {
  hostname?: string;
  resources?: string[];
  vars?: Record<string, string>;
  server?: string;
  enhancedHostSupport?: boolean;
}

export interface FiveMPlayer {
  id: number;
  name: string;
  identifiers?: string[];
  ping?: number;
}

export interface FiveMStatus {
  online: boolean;
  hostname?: string;
  players: number;
  maxPlayers?: number;
  queue?: number;
  resources: number;
  gametype?: string;
  mapname?: string;
  fetchedAt: number;
}

const TIMEOUT_MS = 5000;

async function fetchJson(url: string): Promise<any> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: ac.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

export async function getStatus(serverIp: string): Promise<FiveMStatus> {
  const base = serverIp.startsWith('http') ? serverIp : `http://${serverIp}`;
  try {
    const [info, players] = await Promise.all([
      fetchJson(`${base}/info.json`).catch(() => null),
      fetchJson(`${base}/players.json`).catch(() => []),
    ]);
    if (!info) throw new Error('info.json nedostupan');

    const max = parseInt(info.vars?.sv_maxClients ?? info.vars?.sv_MaxClients ?? '64', 10);

    return {
      online: true,
      hostname: info.vars?.sv_projectName ?? info.vars?.sv_hostname ?? info.vars?.sv_projectDesc ?? 'FiveM Server',
      players: Array.isArray(players) ? players.length : 0,
      maxPlayers: max,
      queue: parseInt(info.vars?.queue ?? '0', 10) || 0,
      resources: Array.isArray(info.resources) ? info.resources.length : 0,
      gametype: info.vars?.gametype,
      mapname: info.vars?.mapname,
      fetchedAt: Date.now(),
    };
  } catch {
    return { online: false, players: 0, resources: 0, fetchedAt: Date.now() };
  }
}
