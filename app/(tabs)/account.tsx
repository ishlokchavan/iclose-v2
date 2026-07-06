import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogOut, Trash2, BookOpen, HelpCircle, Landmark, Sparkles } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { updateMyProfile, CHANNEL_LABEL, ROLE_LABEL, type UserRole, type ContactChannel } from '@/lib/deals';
import { VISIBLE_ROLES } from '@/data/benefits';
import { GlassBg } from '@/components/Glass';
import { PhoneField } from '@/components/PhoneField';
import { colors } from '@/theme/tokens';

const CHANNELS: ContactChannel[] = ['whatsapp', 'call', 'telegram'];

export default function Account() {
  const insets = useSafeAreaInsets();
  const { session, profile, isAdmin, refresh } = useAuth();
  const [role, setRole] = useState<UserRole>('buyer');
  const [phone, setPhone] = useState('+971 ');
  const [channel, setChannel] = useState<ContactChannel | null>(null);
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [iban, setIban] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setRole(profile.role);
      if (profile.phone) setPhone(profile.phone);
      setChannel(profile.preferred_channel);
      setBankName(profile.bank_name ?? '');
      setAccountName(profile.bank_account_name ?? '');
      setIban(profile.iban ?? '');
    }
  }, [profile]);

  async function save() {
    setBusy(true);
    try {
      await updateMyProfile({
        role, phone: phone.trim() || null, preferred_channel: channel ?? undefined,
        bank_name: bankName.trim() || null, bank_account_name: accountName.trim() || null, iban: iban.trim() || null,
      });
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
      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: insets.bottom + 120 }} keyboardShouldPersistTaps="handled">
        <Text className="mb-4 text-[24px] font-bold text-ink">Account</Text>

        {/* Identity */}
        <View className="mb-4 flex-row items-center gap-4">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-ink"><Text className="text-[22px] font-semibold text-white">{name.charAt(0).toUpperCase()}</Text></View>
          <View className="flex-1">
            <Text className="text-[20px] font-semibold text-ink" numberOfLines={1}>{name}</Text>
            <Text className="text-[13.5px] text-graphite" numberOfLines={1}>{session?.user.email}</Text>
            <Text className="mt-0.5 text-[12px] text-graphite-light">{profile?.ref_code}{isAdmin ? ' · Admin' : ''}</Text>
          </View>
        </View>

        {/* Role */}
        <Card>
          <Label>I am a…</Label>
          <View className="flex-row gap-2">
            {VISIBLE_ROLES.map((r) => (
              <Pressable key={r} onPress={() => setRole(r)} className={`flex-1 items-center rounded-2xl border py-3 ${role === r ? 'border-accent bg-accent/10' : 'border-white/60 bg-white/60'}`}>
                <Text className={`text-[14px] font-semibold ${role === r ? 'text-accent' : 'text-ink'}`}>{ROLE_LABEL[r]}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => router.push('/benefits')} className="mt-3 flex-row items-center gap-1.5 self-start">
            <Sparkles size={14} color={colors.accent} /><Text className="text-[13px] font-medium text-accent">See what you get</Text>
          </Pressable>
        </Card>

        {/* Contact */}
        <Card>
          <Label>Phone number</Label>
          <PhoneField value={phone} onChange={setPhone} />
          <Label className="mt-3">Preferred contact</Label>
          <View className="flex-row gap-2">
            {CHANNELS.map((c) => (
              <Pressable key={c} onPress={() => setChannel(c)} className={`flex-1 items-center rounded-2xl border py-2.5 ${channel === c ? 'border-accent bg-accent/10' : 'border-white/60 bg-white/60'}`}>
                <Text className={`text-[13.5px] font-semibold ${channel === c ? 'text-accent' : 'text-ink'}`}>{CHANNEL_LABEL[c]}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Bank details */}
        <Card>
          <View className="mb-2 flex-row items-center gap-2"><Landmark size={16} color={colors.graphite} /><Text className="text-[14px] font-semibold text-ink">Bank details</Text></View>
          <Text className="mb-3 text-[12px] text-graphite">For commission payouts. Handled offline by our team — used for our records only.</Text>
          <Input label="Bank name" value={bankName} onChangeText={setBankName} placeholder="e.g. Emirates NBD" />
          <Input label="Account holder name" value={accountName} onChangeText={setAccountName} placeholder="As on your bank account" />
          <Input label="IBAN" value={iban} onChangeText={setIban} placeholder="AE… " autoCapitalize="characters" />
        </Card>

        <Pressable disabled={busy} onPress={save} className="h-[52px] items-center justify-center rounded-full bg-ink">
          {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-[15px] font-semibold text-white">Save details</Text>}
        </Pressable>

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
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View className="mb-4 rounded-apple border border-white/60 bg-white/70 p-4">{children}</View>;
}
function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <Text className={`mb-1.5 text-[13px] font-medium text-graphite ${className}`}>{children}</Text>;
}
function Input({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View className="mb-2.5">
      <Label>{label}</Label>
      <TextInput {...props} placeholderTextColor={colors.graphiteLight} className="rounded-2xl border border-white/50 bg-white/60 px-4 py-3 text-base text-ink" />
    </View>
  );
}
