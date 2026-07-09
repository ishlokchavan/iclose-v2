import { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Check } from 'lucide-react-native';
import { GlassBg } from '@/components/Glass';
import { Press } from '@/components/Press';
import { SecureNote } from '@/components/ListKit';
import { PhoneField } from '@/components/PhoneField';
import { useAuth } from '@/lib/auth';
import { updateMyProfile, CHANNEL_LABEL, type ContactChannel } from '@/lib/deals';
import { colors } from '@/theme/tokens';

const CHANNELS: ContactChannel[] = ['whatsapp', 'call', 'telegram'];

export default function EditProfile() {
  const insets = useSafeAreaInsets();
  const { profile, refresh } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+971 ');
  const [channel, setChannel] = useState<ContactChannel | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      if (profile.phone) setPhone(profile.phone);
      setChannel(profile.preferred_channel);
    }
  }, [profile]);

  async function save() {
    setBusy(true);
    try {
      await updateMyProfile({ full_name: fullName.trim() || null, phone: phone.trim() || null, preferred_channel: channel });
      await refresh();
      router.back();
    } catch (e) { Alert.alert('Could not save', (e as Error).message); } finally { setBusy(false); }
  }

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center gap-2 px-4 pb-2">
        <Press onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-surface2">
          <ArrowLeft size={20} color={colors.ink} />
        </Press>
        <Text className="flex-1 text-[17px] font-semibold text-ink">Edit profile</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          <View className="gap-4 rounded-apple border border-hairline bg-surface p-4">
            <View>
              <Text className="mb-1.5 text-[13px] font-medium text-graphite">Full name</Text>
              <TextInput value={fullName} onChangeText={setFullName} placeholder="Your name" placeholderTextColor={colors.graphiteLight} className="rounded-2xl border border-hairline bg-surface2 px-4 py-3.5 text-base text-ink" />
            </View>
            <View>
              <Text className="mb-1.5 text-[13px] font-medium text-graphite">Phone number</Text>
              <PhoneField value={phone} onChange={setPhone} />
            </View>
            <View>
              <Text className="mb-1.5 text-[13px] font-medium text-graphite">Preferred contact</Text>
              <View className="flex-row gap-2">
                {CHANNELS.map((c) => {
                  const on = channel === c;
                  return (
                    <Press key={c} onPress={() => setChannel(on ? null : c)} className={`flex-1 items-center rounded-2xl border py-3 ${on ? 'border-accent bg-accent' : 'border-hairline bg-surface2'}`}>
                      <Text className="text-[13.5px] font-semibold" style={{ color: on ? colors.onAccent : colors.ink }}>{CHANNEL_LABEL[c]}</Text>
                    </Press>
                  );
                })}
              </View>
            </View>
          </View>

          <Press disabled={busy} onPress={save} className="mt-6 h-[52px] flex-row items-center justify-center gap-2 rounded-full bg-accent">
            {busy ? <ActivityIndicator color={colors.onAccent} /> : <><Check size={18} color={colors.onAccent} /><Text className="text-[15px] font-semibold" style={{ color: colors.onAccent }}>Save changes</Text></>}
          </Press>
          <SecureNote />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
