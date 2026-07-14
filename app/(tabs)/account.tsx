import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LogOut, Trash2, HelpCircle, Landmark, Sparkles, Camera, Headphones, UserPen, FileText, ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { updateMyProfile, ROLE_LABEL } from '@/lib/deals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadProfileImage, signedUrl } from '@/lib/profile-uploads';
import { clearPushToken } from '@/lib/notifications';
import { GlassBg } from '@/components/Glass';
import { Press, FadeIn } from '@/components/Press';
import { colors } from '@/theme/tokens';

type Row = { key: string; icon: typeof Headphones; label: string; sub: string; href: string };

export default function Account() {
  const insets = useSafeAreaInsets();
  const { session, profile, isAdmin, refresh } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile?.avatar_path) signedUrl(profile.avatar_path).then(setAvatarUrl);
  }, [profile?.avatar_path]);

  async function pickAndUpload() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow photo access to upload.');
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true, allowsEditing: true, aspect: [1, 1] });
    if (res.canceled) return;
    const a = res.assets[0];
    setUploading(true);
    try {
      const path = await uploadProfileImage({ uri: a.uri, base64: a.base64, mimeType: a.mimeType }, 'avatar');
      await updateMyProfile({ avatar_path: path });
      setAvatarUrl(await signedUrl(path));
      await refresh();
    } catch (e) { Alert.alert('Upload failed', (e as Error).message); } finally { setUploading(false); }
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

  const rows: Row[] = [
    { key: 'support', icon: Headphones, label: 'Contact us', sub: 'Call, WhatsApp or email our team', href: '/account/support' },
    { key: 'edit', icon: UserPen, label: 'Edit profile', sub: 'Name, phone & preferred contact', href: '/account/edit' },
    { key: 'documents', icon: FileText, label: 'Documents', sub: 'Emirates ID, passport & more', href: '/account/documents' },
    { key: 'banks', icon: Landmark, label: 'Bank accounts', sub: 'Manage payout accounts', href: '/account/banks' },
  ];

  return (
    <View className="flex-1">
      <GlassBg />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: insets.bottom + 140 }} keyboardShouldPersistTaps="handled">
        <Text className="mb-4 text-[24px] font-bold text-ink">Account</Text>

        {/* Profile card */}
        <FadeIn>
          <View className="mb-6 flex-row items-center gap-4 rounded-apple border border-hairline bg-surface p-4">
            <Pressable onPress={pickAndUpload} className="h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-full bg-accent">
              {avatarUrl ? <Image source={{ uri: avatarUrl }} style={{ width: 64, height: 64 }} contentFit="cover" /> : <Text className="text-[24px] font-semibold" style={{ color: colors.onAccent }}>{name.charAt(0).toUpperCase()}</Text>}
              <View className="absolute bottom-0 right-0 h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-hairline bg-surface2">
                {uploading ? <ActivityIndicator size="small" color={colors.ink} /> : <Camera size={11} color={colors.ink} />}
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
        </FadeIn>

        {/* Menu */}
        <View className="mb-5 overflow-hidden rounded-apple border border-hairline bg-surface">
          {rows.map((r, i) => {
            const Icon = r.icon;
            return (
              <FadeIn key={r.key} delay={i * 40}>
                <Press onPress={() => router.push(r.href as never)} className={`flex-row items-center gap-3.5 px-4 py-3.5 ${i > 0 ? 'border-t border-hairline' : ''}`}>
                  <View className="h-10 w-10 items-center justify-center rounded-2xl bg-surface2"><Icon size={19} color={colors.accent} /></View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-semibold text-ink">{r.label}</Text>
                    <Text className="text-[12.5px] text-graphite" numberOfLines={1}>{r.sub}</Text>
                  </View>
                  <ChevronRight size={19} color={colors.graphiteLight} />
                </Press>
              </FadeIn>
            );
          })}
        </View>

        {/* Info */}
        <View className="mb-8 flex-row gap-3">
          <Press onPress={() => router.push('/benefits')} className="flex-1 flex-row items-center justify-center gap-2 rounded-apple border border-hairline bg-surface py-3.5">
            <Sparkles size={16} color={colors.accent} /><Text className="text-[13.5px] font-medium text-ink">What you get</Text>
          </Press>
          <Press onPress={() => router.push('/faq')} className="flex-1 flex-row items-center justify-center gap-2 rounded-apple border border-hairline bg-surface py-3.5">
            <HelpCircle size={16} color={colors.graphite} /><Text className="text-[13.5px] font-medium text-ink">FAQ</Text>
          </Press>
        </View>

        {/* Account actions */}
        <View className="gap-3">
          <Press onPress={async () => { await clearPushToken(); await AsyncStorage.removeItem('intent_role'); await supabase.auth.signOut(); router.replace('/sign-in'); }} className="h-[50px] flex-row items-center justify-center gap-2 rounded-full border border-hairline bg-surface">
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
