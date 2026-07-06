import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Phone, MessageCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import {
  getDeal, adminUpdateDeal, CHANNEL_LABEL,
  type Deal, type Profile, type DealStatus, type CommissionStatus,
} from '@/lib/deals';
import { GlassBg } from '@/components/Glass';
import { formatAed } from '@/lib/format';
import { colors } from '@/theme/tokens';

const STATUSES: DealStatus[] = ['submitted', 'in_discussion', 'closed_won', 'closed_lost'];
const STATUS_TEXT: Record<DealStatus, string> = { submitted: 'Submitted', in_discussion: 'In discussion', closed_won: 'Closed–Won', closed_lost: 'Closed–Lost' };
const COMMISSIONS: CommissionStatus[] = ['pending', 'paid', 'not_applicable'];
const COMMISSION_TEXT: Record<CommissionStatus, string> = { pending: 'Pending', paid: 'Paid', not_applicable: 'N/A' };

export default function AdminDeal() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAdmin, loading: authLoading } = useAuth();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [submitter, setSubmitter] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [status, setStatus] = useState<DealStatus>('submitted');
  const [statusNote, setStatusNote] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [commissionPct, setCommissionPct] = useState('');
  const [commissionAmount, setCommissionAmount] = useState('');
  const [commissionStatus, setCommissionStatus] = useState<CommissionStatus>('pending');

  const load = useCallback(async () => {
    if (!id) return;
    const d = await getDeal(id);
    if (d) {
      setDeal(d);
      setStatus(d.status);
      setStatusNote(d.status_note ?? '');
      setDealValue(d.deal_value_aed != null ? String(d.deal_value_aed) : '');
      setCommissionPct(d.commission_pct != null ? String(d.commission_pct) : '');
      setCommissionAmount(d.commission_amount_aed != null ? String(d.commission_amount_aed) : '');
      setCommissionStatus(d.commission_status);
      const { data: p } = await supabase.from('profiles').select('id,role,full_name,email,phone,preferred_channel').eq('id', d.user_id).maybeSingle();
      setSubmitter((p as Profile) ?? null);
    }
  }, [id]);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const num = (s: string) => (s.trim() ? Number(s.replace(/[^0-9.]/g, '')) : null);

  async function save() {
    setBusy(true);
    try {
      await adminUpdateDeal(id!, {
        status,
        status_note: statusNote.trim() || null,
        deal_value_aed: num(dealValue),
        commission_pct: num(commissionPct),
        commission_amount_aed: num(commissionAmount),
        commission_status: commissionStatus,
      });
      router.back();
    } catch (e) {
      Alert.alert('Could not save', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Auto-fill commission amount from value × pct when both present and amount empty.
  function autoCommission() {
    const v = num(dealValue), p = num(commissionPct);
    if (v != null && p != null) setCommissionAmount(String(Math.round((v * p) / 100)));
  }

  if (!authLoading && !isAdmin) return <Redirect href="/dashboard" />;

  const phone = submitter?.phone?.replace(/[^0-9]/g, '');

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center gap-2 px-4 pb-2">
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-black/5"><ChevronLeft size={22} color={colors.ink} /></Pressable>
        <Text className="text-[17px] font-semibold text-ink">Manage deal</Text>
      </View>

      {loading ? (
        <ActivityIndicator className="mt-20" color={colors.accent} />
      ) : !deal ? (
        <Text className="mt-20 text-center text-graphite">Deal not found.</Text>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          {/* Submitter + contact */}
          <View className="mb-4 rounded-apple border border-white/60 bg-white/75 p-4">
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
                <Pressable onPress={() => Linking.openURL(`https://wa.me/${phone}`)} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-full bg-[#25D366] py-2.5">
                  <MessageCircle size={16} color="#fff" /><Text className="text-[13.5px] font-semibold text-white">WhatsApp</Text>
                </Pressable>
                <Pressable onPress={() => Linking.openURL(`tel:${phone}`)} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-full bg-ink py-2.5">
                  <Phone size={15} color="#fff" /><Text className="text-[13.5px] font-semibold text-white">Call</Text>
                </Pressable>
              </View>
            ) : <Text className="mt-2 text-[12.5px] text-graphite-light">No phone on file.</Text>}
          </View>

          {/* Status */}
          <Text className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-graphite">Status</Text>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Pressable key={s} onPress={() => setStatus(s)} className={`rounded-full border px-3.5 py-2 ${status === s ? 'border-accent bg-accent/10' : 'border-white/60 bg-white/60'}`}>
                <Text className={`text-[13px] font-semibold ${status === s ? 'text-accent' : 'text-ink'}`}>{STATUS_TEXT[s]}</Text>
              </Pressable>
            ))}
          </View>

          <View className="gap-3 rounded-apple border border-white/60 bg-white/70 p-4">
            <Field label="Update for the user (they'll see this)" value={statusNote} onChangeText={setStatusNote} placeholder="e.g. Viewing arranged for Saturday" multiline />
            <Field label="Deal value (AED)" value={dealValue} onChangeText={setDealValue} onBlur={autoCommission} placeholder="e.g. 2500000" keyboardType="number-pad" />
            <Field label="Commission %" value={commissionPct} onChangeText={setCommissionPct} onBlur={autoCommission} placeholder="e.g. 2" keyboardType="decimal-pad" />
            <Field label="Commission amount (AED)" value={commissionAmount} onChangeText={setCommissionAmount} placeholder="e.g. 50000" keyboardType="number-pad" />
            <View>
              <Text className="mb-1.5 text-[13px] font-medium text-graphite">Commission status</Text>
              <View className="flex-row gap-2">
                {COMMISSIONS.map((c) => (
                  <Pressable key={c} onPress={() => setCommissionStatus(c)} className={`flex-1 items-center rounded-2xl border py-2.5 ${commissionStatus === c ? 'border-accent bg-accent/10' : 'border-white/60 bg-white/60'}`}>
                    <Text className={`text-[13px] font-semibold ${commissionStatus === c ? 'text-accent' : 'text-ink'}`}>{COMMISSION_TEXT[c]}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <Pressable disabled={busy} onPress={save} className="mt-5 rounded-full bg-ink py-4">
            {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-center text-[16px] font-semibold text-white">Save changes</Text>}
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

function Field({ label, multiline, ...props }: { label: string; multiline?: boolean } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Text className="mb-1.5 text-[13px] font-medium text-graphite">{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.graphiteLight}
        style={multiline ? { minHeight: 72, textAlignVertical: 'top' } : undefined}
        className="rounded-2xl border border-white/50 bg-white/60 px-4 py-3.5 text-base text-ink"
      />
    </View>
  );
}
