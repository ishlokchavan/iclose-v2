import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';
import { useAppSettings, adminUpdateSettings, type AppSettings } from '@/lib/settings';
import { writeAudit } from '@/lib/admin';
import { GlassBg } from '@/components/Glass';
import { PhoneField } from '@/components/PhoneField';
import { colors } from '@/theme/tokens';
import { AdminHeader, Field, PrimaryButton } from './_ui';
import { SecureNote } from '@/components/ListKit';

/** Numeric field that keeps a comfortable typing buffer (allows clearing / a
 *  trailing decimal) while emitting a parsed number to the parent. */
function NumField({ label, value, onChange, decimal }: { label: string; value: number; onChange: (n: number) => void; decimal?: boolean }) {
  const [text, setText] = useState(String(value));
  useEffect(() => { if (Number(text || '0') !== value) setText(String(value)); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Field
      label={label}
      value={text}
      keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
      onChangeText={(t) => {
        const cleaned = (decimal ? t.replace(/[^0-9.]/g, '') : t.replace(/[^0-9]/g, ''));
        setText(cleaned);
        onChange(cleaned === '' ? 0 : Number(cleaned));
      }}
    />
  );
}

export default function AdminSettings() {
  const insets = useSafeAreaInsets();
  const { isAdmin, loading: authLoading } = useAuth();
  const settings = useAppSettings();

  const [form, setForm] = useState<AppSettings>(settings);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  // Seed the form once the (async) settings arrive.
  useEffect(() => {
    if (!hydrated) { setForm(settings); setHydrated(true); }
  }, [settings, hydrated]);

  async function save() {
    setBusy(true);
    setSaved(false);
    try {
      await adminUpdateSettings({
        whatsapp_number: form.whatsapp_number.trim(),
        call_number: form.call_number.trim(),
        telegram_username: form.telegram_username?.trim() || null,
        support_email: form.support_email.trim(),
        buyer_fee_aed: form.buyer_fee_aed,
        broker_fee_aed: form.broker_fee_aed,
        conveyance_fee_aed: form.conveyance_fee_aed,
        vip_trustee_fee_aed: form.vip_trustee_fee_aed,
        standard_trustee_aed: form.standard_trustee_aed,
        market_commission_pct: form.market_commission_pct,
        broker_split_pct: form.broker_split_pct,
        offplan_cashback_pct: form.offplan_cashback_pct,
      });
      await writeAudit('update', 'settings', null, 'Updated global settings & pricing');
      setSaved(true);
    } catch (e) {
      Alert.alert('Could not save', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!authLoading && !isAdmin) return <Redirect href="/" />;

  return (
    <View className="flex-1">
      <GlassBg />
      <AdminHeader title="Global settings" insetTop={insets.top} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 110 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-4 text-[13.5px] text-graphite">
          These contact channels power the WhatsApp / call / Telegram / email actions across the app. Changes apply instantly — no redeploy.
        </Text>

        <View className="gap-3 rounded-apple border border-hairline bg-surface p-4">
          <View>
            <Text className="mb-1.5 text-[13px] font-medium text-graphite">WhatsApp number</Text>
            <PhoneField value={form.whatsapp_number} onChange={(t) => { setSaved(false); setForm({ ...form, whatsapp_number: t }); }} />
          </View>
          <View>
            <Text className="mb-1.5 text-[13px] font-medium text-graphite">Call number</Text>
            <PhoneField value={form.call_number} onChange={(t) => { setSaved(false); setForm({ ...form, call_number: t }); }} />
          </View>
          <Field label="Telegram username" value={form.telegram_username ?? ''} onChangeText={(t) => { setSaved(false); setForm({ ...form, telegram_username: t }); }} placeholder="@iclose" autoCapitalize="none" />
          <Field label="Support email" value={form.support_email} onChangeText={(t) => { setSaved(false); setForm({ ...form, support_email: t }); }} placeholder="hello@iclose.ae" autoCapitalize="none" keyboardType="email-address" />
        </View>

        {/* Pricing — Buyers */}
        <Text className="mb-2 mt-6 text-[15px] font-semibold text-ink">Pricing · Buyers</Text>
        <Text className="mb-3 text-[13px] text-graphite">
          Conveyance and VIP trustee apply to buyer secondary deals only. Set any fee to 0 to hide it entirely. Changes apply instantly across the app.
        </Text>
        <View className="gap-3 rounded-apple border border-hairline bg-surface p-4">
          <NumField label="Buyer service fee (AED, per deal)" value={form.buyer_fee_aed} onChange={(n) => { setSaved(false); setForm({ ...form, buyer_fee_aed: n }); }} />
          <NumField label="Conveyance fee (AED — secondary only, 0 = hide)" value={form.conveyance_fee_aed} onChange={(n) => { setSaved(false); setForm({ ...form, conveyance_fee_aed: n }); }} />
          <NumField label="VIP trustee fee (AED — secondary only, 0 = hide)" value={form.vip_trustee_fee_aed} onChange={(n) => { setSaved(false); setForm({ ...form, vip_trustee_fee_aed: n }); }} />
          <NumField label="Standard trustee fee (AED — for comparison, 0 = hide)" value={form.standard_trustee_aed} onChange={(n) => { setSaved(false); setForm({ ...form, standard_trustee_aed: n }); }} />
          <NumField label="Off-plan buyer cashback (% of deal value)" value={form.offplan_cashback_pct} onChange={(n) => { setSaved(false); setForm({ ...form, offplan_cashback_pct: n }); }} decimal />
        </View>

        {/* Pricing — Brokers */}
        <Text className="mb-2 mt-6 text-[15px] font-semibold text-ink">Pricing · Brokers</Text>
        <View className="gap-3 rounded-apple border border-hairline bg-surface p-4">
          <NumField label="Broker service fee (AED, per deal)" value={form.broker_fee_aed} onChange={(n) => { setSaved(false); setForm({ ...form, broker_fee_aed: n }); }} />
          <NumField label="Typical commission split brokers give up (%)" value={form.broker_split_pct} onChange={(n) => { setSaved(false); setForm({ ...form, broker_split_pct: n }); }} decimal />
          <NumField label="Typical market commission (%)" value={form.market_commission_pct} onChange={(n) => { setSaved(false); setForm({ ...form, market_commission_pct: n }); }} decimal />
        </View>

        {saved ? <Text className="mt-3 text-center text-[13px] font-semibold" style={{ color: colors.accent }}>Saved ✓</Text> : null}

        <View className="mt-5">
          <PrimaryButton label="Save settings" onPress={save} busy={busy} />
          <SecureNote text="Changes apply instantly across the app. Every update is logged in the audit trail." />
        </View>
      </ScrollView>
    </View>
  );
}
