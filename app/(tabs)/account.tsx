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
import { CONTACT_WHATSAPP, CONTACT_PHONE } from '@/lib/config';
import { GlassBg } from '@/components/Glass';
import { PhoneField } from '@/components/PhoneField';
import { colors } from '@/theme/tokens';

const CONTACTS = [
  { key: 'call', icon: Phone, label: 'Call', color: '#0071e3', url: `tel:${CONTACT_PHONE}` },
  { key: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', color: '#25D366', url: `https://wa.me/${CONTACT_WHATSAPP}` },
  { key: 'telegram', icon: Send, label: 'Telegram', color: '#229ED9', url: `https://t.me/${CONTACT_PHONE.replace(/[^0-9+]/g, '')}` },
];

export default function Account() {
  const insets = useSafeAreaInsets();
  const { session, profile, isAdmin, refresh } = useAuth();
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
          <Pressable onPress={() => pickAndUpload('avatar')} className="h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-full bg-ink">
            {avatarUrl ? <Image source={{ uri: avatarUrl }} style={{ width: 64, height: 64 }} contentFit="cover" /> : <Text className="text-[24px] font-semibold text-white">{name.charAt(0).toUpperCase()}</Text>}
            <View className="absolute bottom-0 right-0 h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-white bg-accent">
              {uploading === 'avatar' ? <ActivityIndicator size="small" color="#fff" /> : <Camera size={11} color="#fff" />}
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
            {CONTACTS.map((c) => {
              const Icon = c.icon;
              return (
                <Pressable key={c.key} onPress={() => Linking.openURL(c.url)} className="flex-1 items-center gap-1.5 rounded-2xl bg-mist py-3">
                  <Icon size={20} color={c.color} /><Text className="text-[12.5px] font-semibold text-ink">{c.label}</Text>
                </Pressable>
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
          <View className="mb-1 flex-row items-center gap-2"><ShieldCheck size={16} color={colors.graphite} /><Text className="text-[14.5px] font-semibold text-ink">Verification</Text>{profile?.id_doc_path ? <View className="ml-auto flex-row items-center gap-1"><CheckCircle2 size={13} color="#059669" /><Text className="text-[11.5px] text-graphite">On file</Text></View> : null}</View>
          <Text className="mb-3 text-[12px] text-graphite">Upload your Emirates ID or passport to verify faster. Stored privately.</Text>
          <View className="mb-3 flex-row gap-2">
            {(['emirates_id', 'passport'] as const).map((t) => (
              <Pressable key={t} onPress={() => setIdType(t)} className={`flex-1 items-center rounded-2xl border py-2.5 ${idType === t ? 'border-accent bg-accent/10' : 'border-hairline bg-white/60'}`}>
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
        <Pressable onPress={() => setBankOpen((o) => !o)} className="mb-4 rounded-apple border border-white/60 bg-white/70 p-4">
          <View className="flex-row items-center gap-2.5">
            <Landmark size={17} color={colors.graphite} />
            <View className="flex-1"><Text className="text-[14.5px] font-semibold text-ink">Bank details (optional)</Text><Text className="text-[12px] text-graphite">For commission payouts — used internally.</Text></View>
            <ChevronDown size={18} color={colors.graphiteLight} style={{ transform: [{ rotate: bankOpen ? '180deg' : '0deg' }] }} />
          </View>
          {bankOpen ? (
            <View className="mt-4 gap-3">
              <View>
                <FieldLabel>IBAN</FieldLabel>
                <TextInput value={formatIban(iban)} onChangeText={setIban} placeholder="AE__ ____ ____ ____ ____ ___" autoCapitalize="characters" placeholderTextColor={colors.graphiteLight} className="rounded-2xl border border-hairline bg-white/60 px-4 py-3 text-base text-ink" />
                {ibanCheck ? (
                  <View className="mt-1.5 flex-row items-center gap-1.5">
                    {ibanCheck.valid ? <><CheckCircle2 size={13} color="#059669" /><Text className="text-[12px] text-graphite">Valid UAE IBAN · bank code {ibanCheck.bankCode}</Text></> : <Text className="text-[12px]" style={{ color: '#e11d48' }}>Not a valid UAE IBAN yet</Text>}
                  </View>
                ) : null}
              </View>
              <View><FieldLabel>Bank name</FieldLabel><TextInput value={bankName} onChangeText={setBankName} placeholder="e.g. Emirates NBD" placeholderTextColor={colors.graphiteLight} className="rounded-2xl border border-hairline bg-white/60 px-4 py-3 text-base text-ink" /></View>
              <View><FieldLabel>Account holder name</FieldLabel><TextInput value={accountName} onChangeText={setAccountName} placeholder="As on your bank account" placeholderTextColor={colors.graphiteLight} className="rounded-2xl border border-hairline bg-white/60 px-4 py-3 text-base text-ink" /></View>
            </View>
          ) : null}
        </Pressable>

        <Pressable disabled={busy} onPress={save} className="h-[52px] items-center justify-center rounded-full bg-ink">
          {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-[15px] font-semibold text-white">Save changes</Text>}
        </Pressable>

        {/* More */}
        <View className="mt-5 flex-row gap-3">
          <Pressable onPress={() => router.push('/benefits')} className="flex-1 flex-row items-center justify-center gap-2 rounded-apple border border-white/60 bg-white/60 py-3.5">
            <Sparkles size={16} color={colors.accent} /><Text className="text-[13.5px] font-medium text-ink">What you get</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/faq')} className="flex-1 flex-row items-center justify-center gap-2 rounded-apple border border-white/60 bg-white/60 py-3.5">
            <HelpCircle size={16} color={colors.graphite} /><Text className="text-[13.5px] font-medium text-ink">FAQ</Text>
          </Pressable>
        </View>

        {/* Account actions */}
        <View className="mt-8 gap-3">
          <Pressable onPress={async () => { await supabase.auth.signOut(); router.replace('/sign-in'); }} className="h-[50px] flex-row items-center justify-center gap-2 rounded-full border border-hairline bg-white/60">
            <LogOut size={18} color={colors.ink} /><Text className="text-[15px] font-semibold text-ink">Sign out</Text>
          </Pressable>
          <Pressable onPress={confirmDelete} className="h-[50px] flex-row items-center justify-center gap-2 rounded-full" style={{ backgroundColor: 'rgba(225,29,72,0.08)' }}>
            <Trash2 size={17} color="#e11d48" /><Text className="text-[15px] font-semibold" style={{ color: '#e11d48' }}>Delete account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text className="mb-2 ml-1 text-[12px] font-semibold uppercase tracking-wide text-graphite-light">{children}</Text>;
}
function Card({ children }: { children: React.ReactNode }) {
  return <View className="mb-4 rounded-apple border border-white/60 bg-white/75 p-4">{children}</View>;
}
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text className="mb-1.5 text-[13px] font-medium text-graphite">{children}</Text>;
}
