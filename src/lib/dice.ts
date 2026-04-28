// Dice parser/roller za RP sintaksu: NdM[+K|-K]
// Primeri: "1d20", "2d6+3", "4d8-1", "1D100"

export interface ParsedDice {
  count: number;
  sides: number;
  modifier: number;
}

export function parseDice(expr: string): ParsedDice | null {
  const m = expr.trim().match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!m) return null;
  return {
    count: parseInt(m[1], 10),
    sides: parseInt(m[2], 10),
    modifier: m[3] ? parseInt(m[3], 10) : 0,
  };
}

export function rollDice(count: number, sides: number): number[] {
  return Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
}
