import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, LogOut, Trash2, BookOpen, HelpCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { updateMyProfile, CHANNEL_LABEL, ROLE_LABEL, type UserRole, type ContactChannel } from '@/lib/deals';
import { VISIBLE_ROLES } from '@/data/benefits';
import { GlassBg } from '@/components/Glass';
import { PhoneField } from '@/components/PhoneField';
import { BottomNav } from '@/components/BottomNav';
import { colors } from '@/theme/tokens';

const CHANNELS: ContactChannel[] = ['whatsapp', 'call', 'telegram'];

export default function Account() {
  const insets = useSafeAreaInsets();
  const { session, profile, isAdmin, refresh } = useAuth();
  const [role, setRole] = useState<UserRole>('buyer');
  const [phone, setPhone] = useState('+971 ');
  const [channel, setChannel] = useState<ContactChannel | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setRole(profile.role);
      if (profile.phone) setPhone(profile.phone);
      setChannel(profile.preferred_channel);
    }
  }, [profile]);

  async function save() {
    setBusy(true);
    try {
      await updateMyProfile({ role, phone: phone.trim() || null, preferred_channel: channel ?? undefined });
      await refresh();
      Alert.alert('Saved', 'Your details are up to date.');
    } catch (e) {
      Alert.alert('Could not save', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete account', 'This permanently deletes your iClose account and all your inquiries. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
          if (error) return Alert.alert('Delete account', error.message);
          await supabase.auth.signOut();
          router.replace('/sign-in');
        } catch (e) { Alert.alert('Delete account', (e as Error).message); }
      } },
    ]);
  }

  const name = profile?.full_name || session?.user.email?.split('@')[0] || 'Account';

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center gap-2 px-4 pb-2">
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-black/5"><ChevronLeft size={22} color={colors.ink} /></Pressable>
        <Text className="text-[17px] font-semibold text-ink">Account</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 120 }} keyboardShouldPersistTaps="handled">
        {/* Identity */}
        <View className="mb-4 flex-row items-center gap-4">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-ink"><Text className="text-[22px] font-semibold text-white">{name.charAt(0).toUpperCase()}</Text></View>
          <View className="flex-1">
            <Text className="text-[20px] font-semibold text-ink" numberOfLines={1}>{name}</Text>
            <Text className="text-[13.5px] text-graphite" numberOfLines={1}>{session?.user.email}</Text>
            {isAdmin ? <Text className="mt-0.5 text-[12px] font-semibold text-accent">Admin</Text> : null}
          </View>
        </View>

        {/* Role */}
        <View className="mb-4 rounded-apple border border-white/60 bg-white/70 p-4">
          <Text className="mb-2 text-[13px] font-medium text-graphite">I am a…</Text>
          <View className="flex-row gap-2">
            {VISIBLE_ROLES.map((r) => (
              <Pressable key={r} onPress={() => setRole(r)} className={`flex-1 items-center rounded-2xl border py-3 ${role === r ? 'border-accent bg-accent/10' : 'border-white/60 bg-white/60'}`}>
                <Text className={`text-[14px] font-semibold ${role === r ? 'text-accent' : 'text-ink'}`}>{ROLE_LABEL[r]}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => router.push('/benefits')} className="mt-3 self-start"><Text className="text-[13px] font-medium text-accent">See what you get →</Text></Pressable>
        </View>

        {/* Contact */}
        <View className="mb-4 rounded-apple border border-white/60 bg-white/70 p-4">
          <Text className="mb-1.5 text-[13px] font-medium text-graphite">Phone number</Text>
          <PhoneField value={phone} onChange={setPhone} />
          <Text className="mb-2 mt-3 text-[13px] font-medium text-graphite">Preferred contact</Text>
          <View className="flex-row gap-2">
            {CHANNELS.map((c) => (
              <Pressable key={c} onPress={() => setChannel(c)} className={`flex-1 items-center rounded-2xl border py-2.5 ${channel === c ? 'border-accent bg-accent/10' : 'border-white/60 bg-white/60'}`}>
                <Text className={`text-[13.5px] font-semibold ${channel === c ? 'text-accent' : 'text-ink'}`}>{CHANNEL_LABEL[c]}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable disabled={busy} onPress={save} className="rounded-full bg-ink py-3.5">
          {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-center text-[15px] font-semibold text-white">Save details</Text>}
        </Pressable>

        {/* Info links */}
        <View className="mt-6 flex-row gap-3">
          <Pressable onPress={() => router.push('/tutorial')} className="flex-1 flex-row items-center justify-center gap-2 rounded-apple border border-white/60 bg-white/60 py-3">
            <BookOpen size={16} color={colors.graphite} /><Text className="text-[13.5px] font-medium text-ink">How it works</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/faq')} className="flex-1 flex-row items-center justify-center gap-2 rounded-apple border border-white/60 bg-white/60 py-3">
            <HelpCircle size={16} color={colors.graphite} /><Text className="text-[13.5px] font-medium text-ink">FAQ</Text>
          </Pressable>
        </View>

        <Pressable onPress={async () => { await supabase.auth.signOut(); router.replace('/sign-in'); }} className="mt-6 flex-row items-center justify-center gap-2 rounded-apple border border-hairline py-4">
          <LogOut size={18} color={colors.ink} /><Text className="font-semibold text-ink">Sign out</Text>
        </Pressable>
        <Pressable onPress={confirmDelete} className="mt-3 flex-row items-center justify-center gap-2 py-3">
          <Trash2 size={16} color="#e11d48" /><Text className="font-semibold" style={{ color: '#e11d48' }}>Delete account</Text>
        </Pressable>
      </ScrollView>

      <BottomNav active="account" />
    </View>
  );
}
