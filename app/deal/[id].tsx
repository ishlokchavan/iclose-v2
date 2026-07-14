import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { getDeal, getDealEvents, withdrawDeal, estimateCommission, COMMISSION_RATE, type Deal, type DealEvent } from '@/lib/deals';
import { useAppSettings, marketCommission } from '@/lib/settings';
import { GlassBg } from '@/components/Glass';
import { Press, FadeIn } from '@/components/Press';
import { StatusBadge, CommissionBadge } from '@/components/DealUI';
import { formatAed, formatDate, formatTime, dayGroup } from '@/lib/format';
import { colors } from '@/theme/tokens';

export default function DealDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [events, setEvents] = useState<DealEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    const [d, ev] = await Promise.all([getDeal(id), getDealEvents(id)]);
    setDeal(d); setEvents(ev);
  }, [id]);
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  function confirmWithdraw() {
    Alert.alert('Withdraw inquiry', 'This removes your inquiry. You can’t undo this.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Withdraw', style: 'destructive', onPress: async () => { try { await withdrawDeal(id!); router.back(); } catch (e) { Alert.alert('Error', (e as Error).message); } } },
    ]);
  }

  const settings = useAppSettings();
  const isBuyer = profile?.role === 'buyer';
  const base = deal ? deal.deal_value_aed ?? deal.budget_aed ?? null : null;
  const rate = deal ? deal.commission_pct ?? (deal.deal_type ? COMMISSION_RATE[deal.deal_type] : COMMISSION_RATE.secondary) : 0;
  const est = deal ? estimateCommission(deal.deal_type, base) : null;
  // Buyer saving ≈ commission they'd otherwise pay a brokerage, minus our flat fee.
  const buyerEst = deal && base ? { net: Math.max(0, marketCommission(settings, base) - settings.fee_flat_aed) } : null;
  const commissionAmt = deal?.commission_amount_aed ?? (isBuyer ? buyerEst?.net ?? null : est?.amount ?? null);
  const isEstimate = deal?.commission_amount_aed == null;

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center gap-2 px-4 pb-2">
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-surface2"><ChevronLeft size={22} color={colors.ink} /></Pressable>
        <Text className="text-[17px] font-semibold text-ink">Inquiry</Text>
      </View>

      {loading ? (
        <ActivityIndicator className="mt-20" color={colors.accent} />
      ) : !deal ? (
        <Text className="mt-20 text-center text-graphite">This inquiry could not be found.</Text>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
          {/* Header */}
          <View className="flex-row items-center gap-2">
            <StatusBadge status={deal.status} />
            {deal.deal_type ? <View className="rounded-full bg-surface2 px-2.5 py-1"><Text className="text-[11px] font-semibold text-graphite">{deal.deal_type === 'offplan' ? 'Off-plan' : 'Secondary'}</Text></View> : null}
          </View>
          <Text className="mt-3 text-[23px] font-semibold text-ink">{deal.title || deal.area || 'Inquiry'}</Text>
          <Text className="mt-1 text-[13px] text-graphite">{deal.ref_code} · {[deal.emirate, deal.area].filter(Boolean).join(' · ')}</Text>

          {/* Critical info tiles */}
          <FadeIn delay={0}>
          <View className="mt-4 flex-row gap-3">
            <Tile label={isBuyer ? 'Budget' : 'Deal value'} value={base != null ? formatAed(base) : '—'} />
            <Tile label="Rate" value={`${rate}%`} sub={deal.commission_pct == null ? 'estimated' : undefined} />
          </View>
          </FadeIn>
          <FadeIn delay={60}>
          <View className="mt-3 overflow-hidden rounded-apple border border-hairline bg-surface p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[13px] font-medium text-graphite">{isBuyer ? 'Your estimated saving' : 'Your commission (you keep 100%)'}</Text>
              <CommissionBadge status={deal.commission_status} />
            </View>
            <Text className="mt-1 text-[28px] font-bold text-accent">{commissionAmt != null ? formatAed(commissionAmt) : 'To be confirmed'}</Text>
            {isEstimate && commissionAmt != null ? <Text className="text-[12px] text-graphite-light">Estimate at {rate}% — confirmed as your deal progresses.</Text> : null}
          </View>
          </FadeIn>

          {/* Team update */}
          {deal.status_note ? (
            <View className="mt-3 rounded-apple border border-accent/15 bg-accent/8 p-4">
              <Text className="text-[12.5px] font-semibold text-accent">Latest update from our team</Text>
              <Text className="mt-1 text-[14px] leading-relaxed text-ink">{deal.status_note}</Text>
            </View>
          ) : null}

          {/* Details */}
          <FadeIn delay={120}>
          <View className="mt-3 rounded-apple border border-hairline bg-surface p-4">
            <Text className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-graphite">Details</Text>
            {deal.project ? <Row label="Property" value={deal.project} /> : null}
            {deal.property_type ? <Row label="Type" value={deal.property_type} /> : null}
            {deal.bedrooms != null ? <Row label="Bedrooms" value={deal.bedrooms === 0 ? 'Studio' : String(deal.bedrooms)} /> : null}
            <Row label="Location" value={[deal.emirate, deal.area].filter(Boolean).join(' · ') || '—'} />
            {deal.note ? <Row label="Notes" value={deal.note} /> : null}
          </View>
          </FadeIn>

          {/* Activity timeline */}
          <FadeIn delay={180}>
          <View className="mt-3 rounded-apple border border-hairline bg-surface p-4">
            <Text className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-graphite">Activity</Text>
            {events.length === 0 ? (
              <Text className="text-[13px] text-graphite">No activity yet.</Text>
            ) : (
              events.map((e, i) => (
                <View key={e.id} className="flex-row gap-3">
                  <View className="items-center">
                    <View className={`mt-1 h-2.5 w-2.5 rounded-full ${i === 0 ? 'bg-accent' : 'bg-hairline'}`} />
                    {i < events.length - 1 ? <View className="w-px flex-1 bg-hairline" /> : null}
                  </View>
                  <View className="flex-1 pb-4">
                    <Text className="text-[14px] font-semibold text-ink">{e.label}</Text>
                    {e.detail ? <Text className="mt-0.5 text-[13px] text-graphite">{e.detail}</Text> : null}
                    <Text className="mt-0.5 text-[11.5px] text-graphite-light">{dayGroup(e.created_at)} · {formatTime(e.created_at)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
          </FadeIn>

          {deal.status === 'submitted' ? (
            <Press onPress={confirmWithdraw} className="mt-5 flex-row items-center justify-center gap-2 py-3">
              <Trash2 size={16} color="#e11d48" /><Text className="font-semibold" style={{ color: '#e11d48' }}>Withdraw inquiry</Text>
            </Press>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View className="flex-1 rounded-apple border border-hairline bg-surface p-4">
      <Text className="text-[12px] text-graphite">{label}</Text>
      <Text className="mt-1 text-[19px] font-bold text-ink" numberOfLines={1}>{value}</Text>
      {sub ? <Text className="text-[11px] text-graphite-light">{sub}</Text> : null}
    </View>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4 border-b border-hairline py-2.5">
      <Text className="text-[14px] text-graphite">{label}</Text>
      <Text className="flex-1 text-right text-[14px] font-medium text-ink">{value}</Text>
    </View>
  );
}
