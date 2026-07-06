/** Formatting helpers (Hermes-safe — no Intl dependency). */

export function formatAed(n?: number | null): string {
  if (n == null || Number.isNaN(n)) return '—';
  const grouped = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `AED ${grouped}`;
}

export function formatAedShort(n?: number | null): string {
  if (n == null || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (abs >= 1_000) return `AED ${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return formatAed(n);
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
