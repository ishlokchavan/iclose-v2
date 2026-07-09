import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, Linking } from 'react-native';
import { useLocalSearchParams, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Phone, MessageCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import {
  getDeal, getDealEvents, adminUpdateDeal, CHANNEL_LABEL,
  type Deal, type DealEvent, type Profile, type DealStatus, type CommissionStatus,
} from '@/lib/deals';
import { GlassBg } from '@/components/Glass';
import { Press, FadeIn } from '@/components/Press';
import { SecureNote } from '@/components/ListKit';
import { formatAed, formatTime, dayGroup } from '@/lib/format';
import { colors } from '@/theme/tokens';
import { AdminHeader, Loading, Empty, Field, PrimaryButton } from './_ui';

const STATUSES: DealStatus[] = ['submitted', 'in_discussion', 'closed_won', 'closed_lost'];
const STATUS_TEXT: Record<DealStatus, string> = { submitted: 'Submitted', in_discussion: 'In discussion', closed_won: 'Closed–Won', closed_lost: 'Closed–Lost' };
const COMMISSIONS: CommissionStatus[] = ['pending', 'paid', 'not_applicable'];
const COMMISSION_TEXT: Record<CommissionStatus, string> = { pending: 'Pending', paid: 'Paid', not_applicable: 'N/A' };

export default function AdminDeal() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAdmin, loading: authLoading } = useAuth();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [events, setEvents] = useState<DealEvent[]>([]);
  const [submitter, setSubmitter] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const [status, setStatus] = useState<DealStatus>('submitted');
  const [statusNote, setStatusNote] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [commissionPct, setCommissionPct] = useState('');
  const [commissionAmount, setCommissionAmount] = useState('');
  const [commissionStatus, setCommissionStatus] = useState<CommissionStatus>('pending');

  const load = useCallback(async () => {
    if (!id) return;
    const [d, ev] = await Promise.all([getDeal(id), getDealEvents(id)]);
    setEvents(ev);
    if (d) {
      setDeal(d);
      setStatus(d.status);
      setStatusNote(d.status_note ?? '');
      setDealValue(d.deal_value_aed != null ? String(d.deal_value_aed) : '');
      setCommissionPct(d.commission_pct != null ? String(d.commission_pct) : '');
      setCommissionAmount(d.commission_amount_aed != null ? String(d.commission_amount_aed) : '');
      setCommissionStatus(d.commission_status);
      const { data: p } = await supabase.from('profiles').select('*').eq('id', d.user_id).maybeSingle();
      setSubmitter((p as Profile) ?? null);
    }
  }, [id]);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const num = (s: string) => (s.trim() ? Number(s.replace(/[^0-9.]/g, '')) : null);

  async function save() {
    setBusy(true);
    setSaved(false);
    try {
      await adminUpdateDeal(id!, {
        status,
        status_note: statusNote.trim() || null,
        deal_value_aed: num(dealValue),
        commission_pct: num(commissionPct),
        commission_amount_aed: num(commissionAmount),
        commission_status: commissionStatus,
      });
      // Every admin update writes a deal_event via DB trigger — reload so the
      // timeline below reflects the change immediately.
      await load();
      setSaved(true);
    } catch (e) {
      Alert.alert('Could not save', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Auto-fill commission amount from value × pct when both present.
  function autoCommission() {
    const v = num(dealValue), p = num(commissionPct);
    if (v != null && p != null) setCommissionAmount(String(Math.round((v * p) / 100)));
  }

  if (!authLoading && !isAdmin) return <Redirect href="/home" />;

  const phone = submitter?.phone?.replace(/[^0-9]/g, '');

  return (
    <View className="flex-1">
      <GlassBg />
      <AdminHeader title="Manage deal" insetTop={insets.top} />

      {loading ? (
        <Loading />
      ) : !deal ? (
        <Empty text="Deal not found." />
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 110 }} keyboardShouldPersistTaps="handled">
          {/* Submitter + contact */}
          <FadeIn delay={0}>
            <View className="mb-4 rounded-apple border border-hairline bg-surface p-4">
              <Text className="text-[15px] font-semibold text-ink">{deal.title || deal.project || deal.area || 'Inquiry'}</Text>
              <Text className="mt-0.5 text-[13px] text-graphite">
                {submitter?.full_name || submitter?.email || 'Unknown'} · {deal.kind === 'buy' ? 'Buyer' : deal.kind === 'sell' ? 'Seller' : deal.is_referral ? 'Referral' : 'Broker'}
                {submitter?.preferred_channel ? ` · prefers ${CHANNEL_LABEL[submitter.preferred_channel]}` : ''}
              </Text>
              {deal.area || deal.property_type || deal.bedrooms != null || deal.budget_aed != null ? (
                <Text className="mt-1 text-[13px] text-graphite">
                  {[deal.area, deal.property_type, deal.bedrooms != null ? `${deal.bedrooms} BR` : null, deal.budget_aed != null ? `Budget ${formatAed(deal.budget_aed)}` : null].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
              {deal.note ? <Text className="mt-2 text-[13.5px] text-ink">“{deal.note}”</Text> : null}
              {phone ? (
                <View className="mt-3 flex-row gap-2">
                  <Press onPress={() => Linking.openURL(`https://wa.me/${phone}`)} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-full bg-accent py-2.5">
                    <MessageCircle size={16} color={colors.onAccent} /><Text className="text-[13.5px] font-semibold" style={{ color: colors.onAccent }}>WhatsApp</Text>
                  </Press>
                  <Press onPress={() => Linking.openURL(`tel:${phone}`)} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-full border border-hairline bg-surface2 py-2.5">
                    <Phone size={15} color={colors.ink} /><Text className="text-[13.5px] font-semibold text-ink">Call</Text>
                  </Press>
                </View>
              ) : <Text className="mt-2 text-[12.5px] text-graphite-light">No phone on file.</Text>}
            </View>
          </FadeIn>

          {/* Status */}
          <FadeIn delay={50}>
            <Text className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-graphite">Status</Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {STATUSES.map((s) => (
                <Press key={s} onPress={() => setStatus(s)} className={`rounded-full border px-3.5 py-2 ${status === s ? 'border-accent bg-accent/10' : 'border-hairline bg-surface'}`}>
                  <Text className={`text-[13px] font-semibold ${status === s ? 'text-accent' : 'text-ink'}`}>{STATUS_TEXT[s]}</Text>
                </Press>
              ))}
            </View>
          </FadeIn>

          <FadeIn delay={100}>
            <View className="gap-3 rounded-apple border border-hairline bg-surface p-4">
              <Field label="Update for the user (they'll see this)" value={statusNote} onChangeText={setStatusNote} placeholder="e.g. Viewing arranged for Saturday" multiline />
              <Field label="Deal value (AED)" value={dealValue} onChangeText={setDealValue} onBlur={autoCommission} placeholder="e.g. 2500000" keyboardType="number-pad" />
              <Field label="Commission %" value={commissionPct} onChangeText={setCommissionPct} onBlur={autoCommission} placeholder="e.g. 2" keyboardType="decimal-pad" />
              <Field label="Commission amount (AED)" value={commissionAmount} onChangeText={setCommissionAmount} placeholder="e.g. 50000" keyboardType="number-pad" />
              <View>
                <Text className="mb-1.5 text-[13px] font-medium text-graphite">Commission status</Text>
                <View className="flex-row gap-2">
                  {COMMISSIONS.map((c) => (
                    <Press key={c} onPress={() => setCommissionStatus(c)} className={`flex-1 items-center rounded-2xl border py-2.5 ${commissionStatus === c ? 'border-accent bg-accent/10' : 'border-hairline bg-surface'}`}>
                      <Text className={`text-[13px] font-semibold ${commissionStatus === c ? 'text-accent' : 'text-ink'}`}>{COMMISSION_TEXT[c]}</Text>
                    </Press>
                  ))}
                </View>
              </View>
            </View>
          </FadeIn>

          <View className="mt-5">
            <PrimaryButton label="Save changes" onPress={save} busy={busy} />
            {saved ? <Text className="mt-2.5 text-center text-[12.5px] font-semibold text-accent">Changes saved — timeline updated below.</Text> : null}
            <SecureNote text="Changes are logged to the audit trail and the user is notified in their timeline." />
          </View>

          {/* Activity timeline — every admin action lands here via DB trigger. */}
          <FadeIn delay={150}>
            <View className="mt-5 rounded-apple border border-hairline bg-surface p-4">
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
                    <View className={`flex-1 ${i < events.length - 1 ? 'pb-4' : ''}`}>
                      <Text className="text-[14px] font-semibold text-ink">{e.label}</Text>
                      {e.detail ? <Text className="mt-0.5 text-[13px] text-graphite">{e.detail}</Text> : null}
                      <Text className="mt-0.5 text-[11.5px] text-graphite-light">{dayGroup(e.created_at)} · {formatTime(e.created_at)}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </FadeIn>
        </ScrollView>
      )}
    </View>
  );
}
