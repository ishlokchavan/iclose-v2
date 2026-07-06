import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import { getDeal, withdrawDeal, type Deal } from '@/lib/deals';
import { GlassBg } from '@/components/Glass';
import { StatusBadge, CommissionBadge } from '@/components/DealUI';
import { formatAed, formatDate } from '@/lib/format';
import { colors } from '@/theme/tokens';

export default function DealDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => { if (id) setDeal(await getDeal(id)); }, [id]);
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  function confirmWithdraw() {
    Alert.alert('Withdraw inquiry', 'This removes your inquiry. You can’t undo this.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Withdraw', style: 'destructive', onPress: async () => {
        try { await withdrawDeal(id!); router.back(); } catch (e) { Alert.alert('Error', (e as Error).message); }
      } },
    ]);
  }

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center gap-2 px-4 pb-2">
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-black/5"><ChevronLeft size={22} color={colors.ink} /></Pressable>
        <Text className="text-[17px] font-semibold text-ink">Inquiry</Text>
      </View>

      {loading ? (
        <ActivityIndicator className="mt-20" color={colors.accent} />
      ) : !deal ? (
        <Text className="mt-20 text-center text-graphite">This inquiry could not be found.</Text>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
          <View className="rounded-apple border border-white/60 bg-white/75 p-5">
            <View className="flex-row items-center gap-2">
              <StatusBadge status={deal.status} />
              {deal.is_referral ? <View className="rounded-full bg-journey-agent/40 px-2 py-0.5"><Text className="text-[10.5px] font-semibold text-ink">Referral</Text></View> : null}
            </View>
            <Text className="mt-3 text-[22px] font-semibold text-ink">{deal.title || deal.project || deal.area || (deal.kind === 'buy' ? 'Buying inquiry' : 'Deal inquiry')}</Text>
            <Text className="mt-1 text-[13px] text-graphite">Submitted {formatDate(deal.created_at)}</Text>

            {deal.status_note ? (
              <View className="mt-4 rounded-2xl bg-accent/8 border border-accent/15 p-3">
                <Text className="text-[12.5px] font-semibold text-accent">Update from our team</Text>
                <Text className="mt-1 text-[14px] leading-relaxed text-ink">{deal.status_note}</Text>
              </View>
            ) : null}
          </View>

          {/* Details */}
          <View className="mt-3 rounded-apple border border-white/60 bg-white/75 p-5">
            <Text className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-graphite">Details</Text>
            <Row label={deal.kind === 'buy' ? 'Looking to buy' : 'Deal'} value={deal.project || (deal.kind === 'buy' ? 'Property' : '—')} />
            {deal.area ? <Row label="Area" value={deal.area} /> : null}
            {deal.property_type ? <Row label="Type" value={deal.property_type} /> : null}
            {deal.bedrooms != null ? <Row label="Bedrooms" value={String(deal.bedrooms)} /> : null}
            {deal.budget_aed != null ? <Row label="Budget" value={formatAed(deal.budget_aed)} /> : null}
            {deal.deal_value_aed != null ? <Row label="Deal value" value={formatAed(deal.deal_value_aed)} /> : null}
            {deal.note ? <Row label="Notes" value={deal.note} /> : null}
          </View>

          {/* Economics */}
          <View className="mt-3 rounded-apple border border-white/60 bg-white/75 p-5">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-[13px] font-semibold uppercase tracking-wide text-graphite">Commission</Text>
              <CommissionBadge status={deal.commission_status} />
            </View>
            <Row label="Rate" value={deal.commission_pct != null ? `${deal.commission_pct}%` : 'To be confirmed'} />
            <Row label="Amount" value={deal.commission_amount_aed != null ? formatAed(deal.commission_amount_aed) : 'To be confirmed'} />
          </View>

          {deal.status === 'submitted' ? (
            <Pressable onPress={confirmWithdraw} className="mt-5 flex-row items-center justify-center gap-2 py-3">
              <Trash2 size={16} color="#e11d48" /><Text className="font-semibold" style={{ color: '#e11d48' }}>Withdraw inquiry</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4 border-b border-black/5 py-2.5 last:border-0">
      <Text className="text-[14px] text-graphite">{label}</Text>
      <Text className="flex-1 text-right text-[14px] font-medium text-ink">{value}</Text>
    </View>
  );
}
