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

export function formatTime(iso?: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
}

/** Section label for grouping lists: Today / Yesterday / weekday / date. */
export function dayGroup(iso: string): string {
  const d = new Date(iso);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(new Date()) - startOf(d)) / 86_400_000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString('en-GB', { weekday: 'long' });
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Group thousands with commas in a raw digit string (for live input). */
export function withCommas(digits: string): string {
  const clean = digits.replace(/[^0-9]/g, '');
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
