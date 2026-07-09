import type { UserRole } from '@/lib/deals';

/**
 * iClose value proposition — "Never pay commission to buy, sell or close again."
 * Shown on the Benefits screen, in onboarding role selection, and the tutorial.
 */
export const HEADLINE = 'Never pay commission to buy, sell or close again.';

export interface RoleBenefit {
  role: UserRole;
  title: string;
  who: string;
  fee: string;
  feeLabel: string;
  /** Role-specific hero headline. Brokers keep 100% of their commission;
   *  buyers/sellers never pay commission. */
  headline: string;
  points: string[];
  fine?: string;
}

export const ROLE_BENEFITS: Record<UserRole, RoleBenefit> = {
  buyer: {
    role: 'buyer',
    title: 'Buyers',
    who: 'I want to buy a property',
    fee: 'AED 8,250',
    feeLabel: 'conveyance fee — that’s it',
    headline: 'Buy without paying commission.',
    points: [
      '0% commission on secondary real estate',
      'Up to 12% credit back on off-plan',
    ],
    fine: 'The credit system for off-plan buyers becomes available after signing the SPA.',
  },
  seller: {
    role: 'seller',
    title: 'Sellers',
    who: 'I want to sell my property',
    fee: 'AED 8,250',
    feeLabel: 'transfer fee — that’s it',
    headline: 'Sell without paying commission.',
    points: [
      'List your property for free',
      'A dedicated sales agent to sell it for you',
    ],
  },
  broker: {
    role: 'broker',
    title: 'Brokers',
    who: 'I’m a broker closing deals',
    fee: 'AED 3,500',
    feeLabel: 'admin fee — that’s it',
    headline: 'Save 100% of commission.',
    points: [
      'Save 100% of your commission on secondary & off-plan deals — just a AED 3,500 admin fee',
      'Priority EOI booking',
    ],
    fine: 'Priority EOI booking is exclusive to select developers. Details on request.',
  },
};

export const ROLE_ORDER: UserRole[] = ['buyer', 'seller', 'broker'];
/** Roles surfaced in the UI right now (Sellers hidden for launch). */
export const VISIBLE_ROLES: UserRole[] = ['buyer', 'broker'];
