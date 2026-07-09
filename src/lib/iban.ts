import { validateIban } from './profile-uploads';

/**
 * UAE IBAN → bank lookup, like real banking apps: type the IBAN and the bank
 * resolves automatically. UAE IBANs are AE + 2 check digits + 3-digit bank
 * code + 16-digit account. Directory of registered CBUAE bank codes below
 * (verified against public IBAN registries); unknown codes fall back to null
 * so the user can type the bank name manually.
 */
export const UAE_BANKS: Record<string, string> = {
  '003': 'Abu Dhabi Commercial Bank (ADCB)',
  '020': 'HSBC Bank Middle East',
  '022': 'Commercial Bank International',
  '023': 'Commercial Bank of Dubai',
  '024': 'Dubai Islamic Bank',
  '026': 'Emirates NBD',
  '027': 'First Gulf Bank (FAB)',
  '028': 'Habib Bank Limited',
  '029': 'Habib Bank AG Zurich',
  '030': 'Invest Bank',
  '031': 'Janata Bank',
  '033': 'Mashreq Bank',
  '034': 'Emirates Islamic Bank',
  '035': 'First Abu Dhabi Bank (FAB)',
  '040': 'RAKBANK',
  '050': 'Abu Dhabi Islamic Bank (ADIB)',
};

export interface IbanLookup {
  valid: boolean;
  bankCode: string | null;
  bankName: string | null;
  /** Last 4 digits of the account for display. */
  accountTail: string | null;
}

export function lookupIban(raw: string): IbanLookup {
  const s = raw.replace(/\s+/g, '').toUpperCase();
  const { valid, bankCode } = validateIban(s);
  if (!valid || !bankCode) return { valid, bankCode: bankCode ?? null, bankName: null, accountTail: null };
  return {
    valid: true,
    bankCode,
    bankName: UAE_BANKS[bankCode] ?? null,
    accountTail: s.slice(-4),
  };
}

/** Mask an IBAN for display: keep country+check and last 4. */
export function maskIban(raw: string): string {
  const s = raw.replace(/\s+/g, '').toUpperCase();
  if (s.length < 10) return s;
  return `${s.slice(0, 4)} •••• ${s.slice(-4)}`;
}
