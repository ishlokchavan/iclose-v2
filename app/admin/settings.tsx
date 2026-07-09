import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth';
import { useAppSettings, adminUpdateSettings, type AppSettings } from '@/lib/settings';
import { writeAudit } from '@/lib/admin';
import { GlassBg } from '@/components/Glass';
import { colors } from '@/theme/tokens';
import { AdminHeader, Field, PrimaryButton } from './_ui';
import { SecureNote } from '@/components/ListKit';

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
      });
      await writeAudit('update', 'settings', null, 'Updated global contacts');
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
          <Field label="WhatsApp number" value={form.whatsapp_number} onChangeText={(t) => { setSaved(false); setForm({ ...form, whatsapp_number: t }); }} placeholder="9715…" keyboardType="phone-pad" />
          <Field label="Call number" value={form.call_number} onChangeText={(t) => { setSaved(false); setForm({ ...form, call_number: t }); }} placeholder="+9715…" keyboardType="phone-pad" />
          <Field label="Telegram username" value={form.telegram_username ?? ''} onChangeText={(t) => { setSaved(false); setForm({ ...form, telegram_username: t }); }} placeholder="@iclose" autoCapitalize="none" />
          <Field label="Support email" value={form.support_email} onChangeText={(t) => { setSaved(false); setForm({ ...form, support_email: t }); }} placeholder="hello@iclose.ae" autoCapitalize="none" keyboardType="email-address" />
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
