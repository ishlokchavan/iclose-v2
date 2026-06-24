/** Credit economics: 1 credit = 0.5 AED. Ported from the web app. */
export const CREDIT_AED_RATE = 0.5;

export function creditsToAed(credits: number): number {
  return credits * CREDIT_AED_RATE;
}
export function aedToCredits(aed: number): number {
  return Math.round(aed / CREDIT_AED_RATE);
}
