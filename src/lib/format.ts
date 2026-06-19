export function aed(value: number): string {
  if (value >= 1_000_000) return `AED ${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 1_000) return `AED ${Math.round(value / 1_000)}K`;
  return `AED ${value.toLocaleString()}`;
}

export function credits(n: number): string {
  return n.toLocaleString();
}

export function bedLabel(beds: number | null): string {
  if (beds === null) return '—';
  return beds === 0 ? 'Studio' : `${beds} BR`;
}
