import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { updateMyProfile, CHANNEL_LABEL, type UserRole, type ContactChannel } from '@/lib/deals';
import { GlassBg } from '@/components/Glass';
import { Wordmark } from '@/components/DealUI';
import { ROLE_BENEFITS, ROLE_ORDER } from '@/data/benefits';
import { colors } from '@/theme/tokens';

const CHANNELS: ContactChannel[] = ['whatsapp', 'call', 'telegram'];

/** One-time profile completion — role + phone + channel — before the dashboard.
 *  Mandatory: the whole model depends on the team being able to reach the user. */
export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { session, profile, refresh } = useAuth();
  const [role, setRole] = useState<UserRole>('buyer');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<ContactChannel>('whatsapp');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (profile?.phone) setPhone(profile.phone); }, [profile]);
  // Already onboarded (or signed out) — don't sit on this screen.
  useEffect(() => {
    if (!session) router.replace('/sign-in');
    else if (profile?.onboarded) router.replace('/dashboard');
  }, [session, profile]);

  async function finish() {
    if (phone.trim().replace(/[^0-9]/g, '').length < 7) return Alert.alert('Add your phone', 'We need a phone number so our team can reach you to work your deals.');
    setBusy(true);
    try {
      await updateMyProfile({ role, phone: phone.trim(), preferred_channel: channel, onboarded: true });
      await refresh();
      router.replace('/dashboard');
    } catch (e) {
      Alert.alert('Could not save', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="flex-1">
      <GlassBg />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
        <View className="mb-1 items-center"><Wordmark size={28} /></View>
        <Text className="mb-1 mt-3 text-center text-[24px] font-semibold text-ink">Welcome 👋</Text>
        <Text className="mb-6 text-center text-[15px] text-graphite">Tell us who you are so we set you up right.</Text>

        {/* Role selection with the benefit for each */}
        <View className="gap-3">
          {ROLE_ORDER.map((r) => {
            const b = ROLE_BENEFITS[r];
            const active = role === r;
            return (
              <Pressable key={r} onPress={() => setRole(r)} className={`rounded-apple border p-4 ${active ? 'border-accent bg-accent/8' : 'border-white/60 bg-white/70'}`}>
                <View className="flex-row items-center justify-between">
                  <Text className={`text-[16px] font-semibold ${active ? 'text-accent' : 'text-ink'}`}>{b.who}</Text>
                  <View className={`h-6 w-6 items-center justify-center rounded-full border ${active ? 'border-accent bg-accent' : 'border-hairline'}`}>{active ? <Check size={15} color="#fff" /> : null}</View>
                </View>
                <Text className="mt-1 text-[13px] text-graphite">Only pay <Text className="font-semibold text-ink">{b.fee}</Text> {b.feeLabel}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={() => router.push('/benefits')} className="mt-3 self-center"><Text className="text-[13.5px] font-medium text-accent">See exactly what you get →</Text></Pressable>

        {/* Contact */}
        <View className="mt-6 rounded-apple border border-white/60 bg-white/70 p-4">
          <Text className="mb-1.5 text-[13px] font-medium text-graphite">Your phone number</Text>
          <TextInput value={phone} onChangeText={setPhone} placeholder="+971…" keyboardType="phone-pad" placeholderTextColor={colors.graphiteLight} className="rounded-2xl border border-white/50 bg-white/60 px-4 py-3.5 text-base text-ink" />
          <Text className="mb-2 mt-3 text-[13px] font-medium text-graphite">How should we reach you?</Text>
          <View className="flex-row gap-2">
            {CHANNELS.map((c) => (
              <Pressable key={c} onPress={() => setChannel(c)} className={`flex-1 items-center rounded-2xl border py-2.5 ${channel === c ? 'border-accent bg-accent/10' : 'border-white/60 bg-white/60'}`}>
                <Text className={`text-[13.5px] font-semibold ${channel === c ? 'text-accent' : 'text-ink'}`}>{CHANNEL_LABEL[c]}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable disabled={busy} onPress={finish} className="mt-6 rounded-full bg-ink py-4">
          {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-center text-[16px] font-semibold text-white">Continue</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}
