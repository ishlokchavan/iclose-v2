import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, Linking } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LogOut, Trash2, HelpCircle, Landmark, Sparkles, Camera, Phone, MessageCircle, Send, ChevronDown, CheckCircle2, ShieldCheck, Upload } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { updateMyProfile, ROLE_LABEL } from '@/lib/deals';
import { uploadProfileImage, signedUrl, validateIban, formatIban } from '@/lib/profile-uploads';
import { useAppSettings, whatsappLink, telLink, telegramLink } from '@/lib/settings';
import { GlassBg } from '@/components/Glass';
import { Press } from '@/components/Press';
import { PhoneField } from '@/components/PhoneField';
import { colors } from '@/theme/tokens';

type Contact = { key: string; icon: typeof Phone; label: string; color: string; url: string };

export default function Account() {
  const insets = useSafeAreaInsets();
  const { session, profile, isAdmin, refresh } = useAuth();
  const settings = useAppSettings();
  const telegram = telegramLink(settings);
  const contacts: Contact[] = [
    { key: 'call', icon: Phone, label: 'Call', color: colors.accent, url: telLink(settings) },
    { key: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', color: colors.accent, url: whatsappLink(settings) },
    ...(telegram ? [{ key: 'telegram', icon: Send, label: 'Telegram', color: colors.accent, url: telegram }] : []),
  ];
  const [phone, setPhone] = useState('+971 ');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [iban, setIban] = useState('');
  const [bankOpen, setBankOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [idUrl, setIdUrl] = useState<string | null>(null);
  const [idType, setIdType] = useState<'emirates_id' | 'passport'>('emirates_id');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<'avatar' | 'id' | null>(null);

  useEffect(() => {
    if (profile) {
      if (profile.phone) setPhone(profile.phone);
      setBankName(profile.bank_name ?? '');
      setAccountName(profile.bank_account_name ?? '');
      setIban(profile.iban ?? '');
      if (profile.id_doc_type === 'passport' || profile.id_doc_type === 'emirates_id') setIdType(profile.id_doc_type);
      signedUrl(profile.avatar_path).then(setAvatarUrl);
      signedUrl(profile.id_doc_path).then(setIdUrl);
    }
  }, [profile]);

  const ibanCheck = iban.trim() ? validateIban(iban) : null;

  async function pickAndUpload(kind: 'avatar' | 'id') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow photo access to upload.');
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true, allowsEditing: true, aspect: kind === 'avatar' ? [1, 1] : undefined });
    if (res.canceled) return;
    const a = res.assets[0];
    setUploading(kind);
    try {
      const path = await uploadProfileImage({ uri: a.uri, base64: a.base64, mimeType: a.mimeType }, kind);
      await updateMyProfile(kind === 'avatar' ? { avatar_path: path } : { id_doc_path: path, id_doc_type: idType });
      const url = await signedUrl(path);
      if (kind === 'avatar') setAvatarUrl(url); else setIdUrl(url);
      await refresh();
    } catch (e) { Alert.alert('Upload failed', (e as Error).message); } finally { setUploading(null); }
  }

  async function save() {
    setBusy(true);
    try {
      await updateMyProfile({ phone: phone.trim() || null, bank_name: bankName.trim() || null, bank_account_name: accountName.trim() || null, iban: iban.replace(/\s+/g, '').toUpperCase() || null });
      await refresh();
      Alert.alert('Saved', 'Your details are up to date.');
    } catch (e) { Alert.alert('Could not save', (e as Error).message); } finally { setBusy(false); }
  }

  function confirmDelete() {
    Alert.alert('Delete account', 'This permanently deletes your iClose account and all your inquiries. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' }); if (error) return Alert.alert('Delete account', error.message); await supabase.auth.signOut(); router.replace('/sign-in'); } catch (e) { Alert.alert('Delete account', (e as Error).message); }
      } },
    ]);
  }

  const name = profile?.full_name || session?.user.email?.split('@')[0] || 'Account';

  return (
    <View className="flex-1">
      <GlassBg />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: insets.bottom + 140 }} keyboardShouldPersistTaps="handled">
        <Text className="mb-4 text-[24px] font-bold text-ink">Account</Text>

        {/* Identity */}
        <View className="mb-6 flex-row items-center gap-4">
          <Pressable onPress={() => pickAndUpload('avatar')} className="h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-full bg-accent">
            {avatarUrl ? <Image source={{ uri: avatarUrl }} style={{ width: 64, height: 64 }} contentFit="cover" /> : <Text className="text-[24px] font-semibold" style={{ color: colors.onAccent }}>{name.charAt(0).toUpperCase()}</Text>}
            <View className="absolute bottom-0 right-0 h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-hairline bg-surface2">
              {uploading === 'avatar' ? <ActivityIndicator size="small" color={colors.ink} /> : <Camera size={11} color={colors.ink} />}
            </View>
          </Pressable>
          <View className="flex-1">
            <Text className="text-[19px] font-semibold text-ink" numberOfLines={1}>{name}</Text>
            <Text className="text-[13px] text-graphite" numberOfLines={1}>{session?.user.email}</Text>
            <View className="mt-1.5 flex-row items-center gap-1.5">
              <View className="rounded-full bg-accent/10 px-2 py-0.5"><Text className="text-[11.5px] font-semibold text-accent">{profile ? ROLE_LABEL[profile.role] : ''}</Text></View>
              <Text className="text-[11.5px] text-graphite-light">{profile?.ref_code}{isAdmin ? ' · Admin' : ''}</Text>
            </View>
          </View>
        </View>

        {/* Support */}
        <SectionLabel>Support</SectionLabel>
        <Card>
          <Text className="mb-2.5 text-[13px] text-graphite">Need help? Talk to our team.</Text>
          <View className="flex-row gap-2.5">
            {contacts.map((c) => {
              const Icon = c.icon;
              return (
                <Press key={c.key} onPress={() => Linking.openURL(c.url)} className="flex-1 items-center gap-1.5 rounded-2xl bg-mist py-3">
                  <Icon size={20} color={c.color} /><Text className="text-[12.5px] font-semibold text-ink">{c.label}</Text>
                </Press>
              );
            })}
          </View>
        </Card>

        {/* Your details */}
        <SectionLabel>Your details</SectionLabel>
        <Card>
          <FieldLabel>Phone number</FieldLabel>
          <PhoneField value={phone} onChange={setPhone} />
        </Card>

        {/* Verification */}
        <Card>
          <View className="mb-1 flex-row items-center gap-2"><ShieldCheck size={16} color={colors.graphite} /><Text className="text-[14.5px] font-semibold text-ink">Verification</Text>{profile?.id_doc_path ? <View className="ml-auto flex-row items-center gap-1"><CheckCircle2 size={13} color={colors.accent} /><Text className="text-[11.5px] text-graphite">On file</Text></View> : null}</View>
          <Text className="mb-3 text-[12px] text-graphite">Upload your Emirates ID or passport to verify faster. Stored privately.</Text>
          <View className="mb-3 flex-row gap-2">
            {(['emirates_id', 'passport'] as const).map((t) => (
              <Pressable key={t} onPress={() => setIdType(t)} className={`flex-1 items-center rounded-2xl border py-2.5 ${idType === t ? 'border-accent bg-accent/10' : 'border-hairline bg-surface'}`}>
                <Text className={`text-[13px] font-semibold ${idType === t ? 'text-accent' : 'text-ink'}`}>{t === 'emirates_id' ? 'Emirates ID' : 'Passport'}</Text>
              </Pressable>
            ))}
          </View>
          {idUrl ? <View className="mb-2 overflow-hidden rounded-2xl border border-hairline"><Image source={{ uri: idUrl }} style={{ width: '100%', height: 150 }} contentFit="cover" /></View> : null}
          <Pressable onPress={() => pickAndUpload('id')} className="flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-accent/40 bg-accent/5 py-3.5">
            {uploading === 'id' ? <ActivityIndicator color={colors.accent} /> : <><Upload size={17} color={colors.accent} /><Text className="text-[14px] font-semibold text-accent">{idUrl ? 'Replace document' : 'Upload document'}</Text></>}
          </Pressable>
        </Card>

        {/* Bank details (collapsible) */}
        <SectionLabel>Payouts</SectionLabel>
        <Pressable onPress={() => setBankOpen((o) => !o)} className="mb-4 rounded-apple border border-hairline bg-surface p-4">
          <View className="flex-row items-center gap-2.5">
            <Landmark size={17} color={colors.graphite} />
            <View className="flex-1"><Text className="text-[14.5px] font-semibold text-ink">Bank details (optional)</Text><Text className="text-[12px] text-graphite">For commission payouts — used internally.</Text></View>
            <ChevronDown size={18} color={colors.graphiteLight} style={{ transform: [{ rotate: bankOpen ? '180deg' : '0deg' }] }} />
          </View>
          {bankOpen ? (
            <View className="mt-4 gap-3">
              <View>
                <FieldLabel>IBAN</FieldLabel>
                <TextInput value={formatIban(iban)} onChangeText={setIban} placeholder="AE__ ____ ____ ____ ____ ___" autoCapitalize="characters" placeholderTextColor={colors.graphiteLight} className="rounded-2xl border border-hairline bg-surface px-4 py-3 text-base text-ink" />
                {ibanCheck ? (
                  <View className="mt-1.5 flex-row items-center gap-1.5">
                    {ibanCheck.valid ? <><CheckCircle2 size={13} color={colors.accent} /><Text className="text-[12px] text-graphite">Valid UAE IBAN · bank code {ibanCheck.bankCode}</Text></> : <Text className="text-[12px]" style={{ color: '#ff453a' }}>Not a valid UAE IBAN yet</Text>}
                  </View>
                ) : null}
              </View>
              <View><FieldLabel>Bank name</FieldLabel><TextInput value={bankName} onChangeText={setBankName} placeholder="e.g. Emirates NBD" placeholderTextColor={colors.graphiteLight} className="rounded-2xl border border-hairline bg-surface px-4 py-3 text-base text-ink" /></View>
              <View><FieldLabel>Account holder name</FieldLabel><TextInput value={accountName} onChangeText={setAccountName} placeholder="As on your bank account" placeholderTextColor={colors.graphiteLight} className="rounded-2xl border border-hairline bg-surface px-4 py-3 text-base text-ink" /></View>
            </View>
          ) : null}
        </Pressable>

        <Press disabled={busy} onPress={save} className="h-[52px] items-center justify-center rounded-full bg-accent">
          {busy ? <ActivityIndicator color={colors.onAccent} /> : <Text className="text-[15px] font-semibold" style={{ color: colors.onAccent }}>Save changes</Text>}
        </Press>

        {/* More */}
        <View className="mt-5 flex-row gap-3">
          <Press onPress={() => router.push('/benefits')} className="flex-1 flex-row items-center justify-center gap-2 rounded-apple border border-hairline bg-surface py-3.5">
            <Sparkles size={16} color={colors.accent} /><Text className="text-[13.5px] font-medium text-ink">What you get</Text>
          </Press>
          <Press onPress={() => router.push('/faq')} className="flex-1 flex-row items-center justify-center gap-2 rounded-apple border border-hairline bg-surface py-3.5">
            <HelpCircle size={16} color={colors.graphite} /><Text className="text-[13.5px] font-medium text-ink">FAQ</Text>
          </Press>
        </View>

        {/* Account actions */}
        <View className="mt-8 gap-3">
          <Press onPress={async () => { await supabase.auth.signOut(); router.replace('/sign-in'); }} className="h-[50px] flex-row items-center justify-center gap-2 rounded-full border border-hairline bg-surface">
            <LogOut size={18} color={colors.ink} /><Text className="text-[15px] font-semibold text-ink">Sign out</Text>
          </Press>
          <Press onPress={confirmDelete} className="h-[50px] flex-row items-center justify-center gap-2 rounded-full bg-surface" style={{ borderWidth: 1, borderColor: 'rgba(255,69,58,0.4)' }}>
            <Trash2 size={17} color="#ff453a" /><Text className="text-[15px] font-semibold" style={{ color: '#ff453a' }}>Delete account</Text>
          </Press>
        </View>

        {/* Legal */}
        <View className="mt-6 flex-row items-center justify-center gap-2">
          <Pressable onPress={() => router.push('/privacy')} hitSlop={8}><Text className="text-[12.5px] text-graphite-light">Privacy Policy</Text></Pressable>
          <Text className="text-[12.5px] text-graphite-light">·</Text>
          <Pressable onPress={() => router.push('/terms')} hitSlop={8}><Text className="text-[12.5px] text-graphite-light">Terms</Text></Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text className="mb-2 ml-1 text-[12px] font-semibold uppercase tracking-wide text-graphite-light">{children}</Text>;
}
function Card({ children }: { children: React.ReactNode }) {
  return <View className="mb-4 rounded-apple border border-hairline bg-surface p-4">{children}</View>;
}
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text className="mb-1.5 text-[13px] font-medium text-graphite">{children}</Text>;
}
