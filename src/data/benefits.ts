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
    fee: 'AED 3,699',
    feeLabel: 'flat · all-inclusive, per deal',
    headline: 'Buy without paying commission.',
    points: [
      'One flat fee per deal — off-plan or secondary',
      'No agent commission — keep what you’d have paid a broker',
      'A dedicated team handling it on WhatsApp or a call',
    ],
    fine: 'Secondary transfers also carry standard transaction costs (conveyance & trustee), shown upfront before you proceed.',
  },
  seller: {
    role: 'seller',
    title: 'Sellers',
    who: 'I want to sell my property',
    fee: 'AED 3,699',
    feeLabel: 'flat · all-inclusive, per deal',
    headline: 'Sell without paying commission.',
    points: [
      'One flat fee — no percentage commission',
      'A dedicated sales agent to sell it for you',
    ],
  },
  broker: {
    role: 'broker',
    title: 'Brokers',
    who: 'I’m a broker closing deals',
    fee: 'AED 3,699',
    feeLabel: 'flat · all-inclusive, per deal',
    headline: 'Keep 100% of your commission.',
    points: [
      'Keep 100% of your commission — secondary & off-plan',
      'Just one flat fee per closed deal',
      'Priority EOI booking with select developers',
    ],
    fine: 'Priority EOI booking is exclusive to select developers. Details on request.',
  },
};

export const ROLE_ORDER: UserRole[] = ['buyer', 'seller', 'broker'];
/** Roles surfaced in the UI right now (Sellers hidden for launch). */
export const VISIBLE_ROLES: UserRole[] = ['buyer', 'broker'];
