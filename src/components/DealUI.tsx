import { View, Text } from 'react-native';
import type { CommissionStatus, DealStatus } from '@/lib/deals';
import { COMMISSION_LABEL, STATUS_LABEL } from '@/lib/deals';

/** iClose wordmark — light on black with a neon-lime dot, matching the poster. */
export function Wordmark({ size = 26 }: { size?: number }) {
  return (
    <Text style={{ fontSize: size, fontWeight: '700', letterSpacing: -0.5, color: '#f5f5f7' }}>
      iClose<Text style={{ color: '#9eff00' }}>.</Text>
    </Text>
  );
}

const STATUS_STYLE: Record<DealStatus, { bg: string; fg: string }> = {
  submitted: { bg: 'rgba(245,158,11,0.16)', fg: '#fbbf24' },
  in_discussion: { bg: 'rgba(158,255,0,0.16)', fg: '#9eff00' },
  closed_won: { bg: 'rgba(52,211,153,0.16)', fg: '#34d399' },
  closed_lost: { bg: 'rgba(160,160,166,0.16)', fg: '#a1a1a6' },
};

export function StatusBadge({ status }: { status: DealStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <View style={{ backgroundColor: s.bg }} className="self-start rounded-full px-2.5 py-1">
      <Text style={{ color: s.fg }} className="text-[11.5px] font-semibold">{STATUS_LABEL[status]}</Text>
    </View>
  );
}

const COMMISSION_STYLE: Record<CommissionStatus, { bg: string; fg: string }> = {
  pending: { bg: 'rgba(245,158,11,0.16)', fg: '#fbbf24' },
  paid: { bg: 'rgba(52,211,153,0.16)', fg: '#34d399' },
  not_applicable: { bg: 'rgba(160,160,166,0.16)', fg: '#a1a1a6' },
};

export function CommissionBadge({ status }: { status: CommissionStatus }) {
  const s = COMMISSION_STYLE[status];
  return (
    <View style={{ backgroundColor: s.bg }} className="self-start rounded-full px-2.5 py-1">
      <Text style={{ color: s.fg }} className="text-[11.5px] font-semibold">Commission {COMMISSION_LABEL[status]}</Text>
    </View>
  );
}
