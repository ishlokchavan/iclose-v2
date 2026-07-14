/**
 * Trust & safety content. Real-estate buyers/brokers worry: "what stops iClose
 * from taking my commission or cashback?" These are the concrete, in-product
 * guarantees that answer that — every one is verifiable by the user inside the
 * app, so we never over-claim.
 */
export interface TrustPoint {
  icon: 'shield' | 'eye' | 'file' | 'wallet' | 'lock' | 'headset';
  title: string;
  body: string;
}

export const TRUST_POINTS: TrustPoint[] = [
  {
    icon: 'wallet',
    title: 'You keep 100% — always',
    body: 'We only ever take the one flat fee shown to you before you commit. Your commission or cashback is yours; we never deduct a percentage.',
  },
  {
    icon: 'eye',
    title: 'Every step is tracked in the app',
    body: 'From inquiry to payout, each stage is timestamped and visible to you in real time. Nothing happens off the record.',
  },
  {
    icon: 'file',
    title: 'Documented, in writing',
    body: 'Every deal has its numbers agreed up front and recorded — the fee, the payout, the terms. What you see is what you get.',
  },
  {
    icon: 'lock',
    title: 'Your data is encrypted',
    body: 'Your details, documents and bank information are encrypted in transit and visible only to the team handling your deal.',
  },
  {
    icon: 'headset',
    title: 'A real, named account manager',
    body: 'You get a dedicated person — reachable on WhatsApp or a call — not a black box. Ask them anything, any time.',
  },
  {
    icon: 'shield',
    title: 'No hidden fees, ever',
    body: 'The flat fee (and, for secondary transfers, standard conveyance and trustee costs) is all you pay. No surprises at closing.',
  },
];

export const TRUST_HEADLINE = 'Your money stays yours.';
export const TRUST_SUB = 'The honest question is "what stops you taking my commission?" Here’s exactly what does.';
