import { View, Text } from 'react-native';
import type { CommissionStatus, DealStatus } from '@/lib/deals';
import { COMMISSION_LABEL, STATUS_LABEL } from '@/lib/deals';

/** iClose wordmark — lowercase, accent dot, matching the current brand. */
export function Wordmark({ size = 26 }: { size?: number }) {
  return (
    <Text style={{ fontSize: size, fontWeight: '700', letterSpacing: -0.5, color: '#1d1d1f' }}>
      iClose<Text style={{ color: '#0071e3' }}>.</Text>
    </Text>
  );
}

const STATUS_STYLE: Record<DealStatus, { bg: string; fg: string }> = {
  submitted: { bg: 'rgba(245,158,11,0.14)', fg: '#b45309' },
  in_discussion: { bg: 'rgba(0,113,227,0.12)', fg: '#0071e3' },
  closed_won: { bg: 'rgba(16,185,129,0.14)', fg: '#059669' },
  closed_lost: { bg: 'rgba(110,110,115,0.14)', fg: '#6e6e73' },
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
  pending: { bg: 'rgba(245,158,11,0.14)', fg: '#b45309' },
  paid: { bg: 'rgba(16,185,129,0.14)', fg: '#059669' },
  not_applicable: { bg: 'rgba(110,110,115,0.12)', fg: '#6e6e73' },
};

export function CommissionBadge({ status }: { status: CommissionStatus }) {
  const s = COMMISSION_STYLE[status];
  return (
    <View style={{ backgroundColor: s.bg }} className="self-start rounded-full px-2.5 py-1">
      <Text style={{ color: s.fg }} className="text-[11.5px] font-semibold">Commission {COMMISSION_LABEL[status]}</Text>
    </View>
  );
}
