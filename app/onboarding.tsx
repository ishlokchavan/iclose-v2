import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ShoppingBag, Briefcase, MessageCircle, Phone, Send } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { updateMyProfile, type UserRole, type ContactChannel } from '@/lib/deals';
import { VISIBLE_ROLES } from '@/data/benefits';
import { GlassBg } from '@/components/Glass';
import { Wordmark } from '@/components/DealUI';
import { PhoneField } from '@/components/PhoneField';
import { colors } from '@/theme/tokens';

const ROLE_UI: Record<UserRole, { icon: typeof ShoppingBag; label: string; sub: string }> = {
  buyer: { icon: ShoppingBag, label: 'I want to buy', sub: 'Find a home and skip the commission' },
  broker: { icon: Briefcase, label: 'I’m a broker', sub: 'Close deals and keep 100% commission' },
  seller: { icon: Briefcase, label: 'I want to sell', sub: 'List your property for a flat fee' },
};
const CHANNELS: { key: ContactChannel; icon: typeof MessageCircle; label: string; color: string }[] = [
  { key: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', color: '#25D366' },
  { key: 'call', icon: Phone, label: 'Call', color: '#0071e3' },
  { key: 'telegram', icon: Send, label: 'Telegram', color: '#229ED9' },
];

/** One-time profile completion — role + phone + channel — before the dashboard. */
export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { session, profile, refresh } = useAuth();
  const [role, setRole] = useState<UserRole>('buyer');
  const [phone, setPhone] = useState('+971 ');
  const [channel, setChannel] = useState<ContactChannel>('whatsapp');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session) router.replace('/sign-in');
    else if (profile?.onboarded) router.replace('/home');
  }, [session, profile]);

  async function finish() {
    if (phone.replace(/[^0-9]/g, '').length < 8) return Alert.alert('Add your phone', 'We need a phone number so our team can reach you.');
    setBusy(true);
    try {
      await updateMyProfile({ role, phone: phone.trim(), preferred_channel: channel, onboarded: true });
      await refresh();
      router.replace('/home');
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
        <View className="mb-1 items-center"><Wordmark size={26} /></View>
        <Text className="mb-1 mt-3 text-center text-[24px] font-semibold text-ink">Let’s set you up</Text>
        <Text className="mb-6 text-center text-[15px] text-graphite">A few quick details so we can help you.</Text>

        {/* Role */}
        <Text className="mb-2 text-[13px] font-semibold text-graphite">What brings you here?</Text>
        <View className="gap-2.5">
          {VISIBLE_ROLES.map((r) => {
            const ui = ROLE_UI[r];
            const Icon = ui.icon;
            const active = role === r;
            return (
              <Pressable key={r} onPress={() => setRole(r)} className={`flex-row items-center gap-3 rounded-apple border p-4 ${active ? 'border-accent bg-accent/8' : 'border-white/60 bg-white/70'}`}>
                <View className={`h-11 w-11 items-center justify-center rounded-full ${active ? 'bg-accent' : 'bg-mist'}`}><Icon size={22} color={active ? '#fff' : colors.graphite} /></View>
                <View className="flex-1">
                  <Text className={`text-[15.5px] font-semibold ${active ? 'text-accent' : 'text-ink'}`}>{ui.label}</Text>
                  <Text className="text-[12.5px] text-graphite">{ui.sub}</Text>
                </View>
                <View className={`h-6 w-6 items-center justify-center rounded-full border ${active ? 'border-accent bg-accent' : 'border-hairline'}`}>{active ? <Check size={15} color="#fff" /> : null}</View>
              </Pressable>
            );
          })}
        </View>

        {/* Phone */}
        <Text className="mb-2 mt-6 text-[13px] font-semibold text-graphite">Your phone number</Text>
        <PhoneField value={phone} onChange={setPhone} />

        {/* Channel */}
        <Text className="mb-2 mt-6 text-[13px] font-semibold text-graphite">How should we reach you?</Text>
        <View className="flex-row gap-2.5">
          {CHANNELS.map((c) => {
            const Icon = c.icon;
            const active = channel === c.key;
            return (
              <Pressable key={c.key} onPress={() => setChannel(c.key)} className={`flex-1 items-center gap-1.5 rounded-apple border py-3.5 ${active ? 'border-accent bg-accent/8' : 'border-white/60 bg-white/70'}`}>
                <Icon size={22} color={active ? c.color : colors.graphite} />
                <Text className={`text-[13px] font-semibold ${active ? 'text-ink' : 'text-graphite'}`}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable disabled={busy} onPress={finish} className="mt-8 h-[52px] items-center justify-center rounded-full bg-ink">
          {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-[16px] font-semibold text-white">Continue</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}
