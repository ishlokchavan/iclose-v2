import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { submitInquiry, type NewInquiry } from '@/lib/deals';
import { GlassBg } from '@/components/Glass';
import { colors } from '@/theme/tokens';

export default function NewInquiryScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const isBuyer = profile?.role === 'buyer';

  const [project, setProject] = useState('');
  const [area, setArea] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [amount, setAmount] = useState(''); // deal value (agent) or budget (buyer)
  const [note, setNote] = useState('');
  const [isReferral, setIsReferral] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (isBuyer && !area.trim()) return Alert.alert('Add an area', 'Where do you want to buy?');
    if (!isBuyer && !project.trim() && !area.trim()) return Alert.alert('Add details', 'Tell us the project or area of the deal.');
    setBusy(true);
    try {
      const amt = amount ? Number(amount.replace(/[^0-9.]/g, '')) : null;
      const input: NewInquiry = isBuyer
        ? {
            kind: 'buy',
            area: area.trim() || null,
            property_type: propertyType.trim() || null,
            bedrooms: bedrooms ? Number(bedrooms) : null,
            budget_aed: amt,
            note: note.trim() || null,
            title: [propertyType.trim(), area.trim()].filter(Boolean).join(' in ') || 'Buying inquiry',
          }
        : {
            kind: 'close',
            is_referral: isReferral,
            project: project.trim() || null,
            area: area.trim() || null,
            deal_value_aed: amt,
            note: note.trim() || null,
            title: project.trim() || area.trim() || 'Deal inquiry',
          };
      await submitInquiry(input);
      router.back();
      setTimeout(() => Alert.alert('Submitted ✅', 'Our team will reach out to you shortly to take it forward.'), 250);
    } catch (e) {
      Alert.alert('Could not submit', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center justify-between px-4 pb-2">
        <Text className="text-[17px] font-semibold text-ink">{isBuyer ? 'New buying inquiry' : 'New deal inquiry'}</Text>
        <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-full bg-black/5"><X size={20} color={colors.ink} /></Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <View className="gap-3 rounded-apple border border-white/60 bg-white/70 p-4">
          {isBuyer ? (
            <>
              <Field label="Where do you want to buy?" value={area} onChangeText={setArea} placeholder="e.g. Dubai Marina" />
              <Field label="Property type" value={propertyType} onChangeText={setPropertyType} placeholder="Apartment, villa, townhouse…" />
              <Field label="Bedrooms" value={bedrooms} onChangeText={setBedrooms} placeholder="e.g. 2" keyboardType="number-pad" />
              <Field label="Budget (AED)" value={amount} onChangeText={setAmount} placeholder="e.g. 2000000" keyboardType="number-pad" />
            </>
          ) : (
            <>
              <Field label="Project / property" value={project} onChangeText={setProject} placeholder="e.g. Emaar Beachfront" />
              <Field label="Area" value={area} onChangeText={setArea} placeholder="e.g. Dubai Marina" />
              <Field label="Deal value (AED)" value={amount} onChangeText={setAmount} placeholder="e.g. 2500000" keyboardType="number-pad" />
            </>
          )}
          <Field label="Notes" value={note} onChangeText={setNote} placeholder="Anything we should know" multiline />

          {!isBuyer ? (
            <View className="mt-1 flex-row items-center justify-between rounded-2xl border border-white/50 bg-white/60 px-4 py-3">
              <View className="flex-1 pr-3">
                <Text className="text-[14.5px] font-medium text-ink">Refer this deal to iClose</Text>
                <Text className="text-[12.5px] text-graphite">We close it on your behalf and you earn a referral commission.</Text>
              </View>
              <Switch value={isReferral} onValueChange={setIsReferral} trackColor={{ true: colors.accent }} />
            </View>
          ) : null}
        </View>

        <Pressable disabled={busy} onPress={submit} className="mt-5 rounded-full bg-ink py-4">
          {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-center text-[16px] font-semibold text-white">Submit inquiry</Text>}
        </Pressable>
        <Text className="mt-3 px-2 text-center text-[12px] text-graphite-light">Our team handles the rest over WhatsApp, call or Telegram.</Text>
      </ScrollView>
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
        style={multiline ? { minHeight: 88, textAlignVertical: 'top' } : undefined}
        className="rounded-2xl border border-white/50 bg-white/60 px-4 py-3.5 text-base text-ink"
      />
    </View>
  );
}
