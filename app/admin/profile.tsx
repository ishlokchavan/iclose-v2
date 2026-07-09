import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, LogOut } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { updateMyProfile } from '@/lib/deals';
import { uploadProfileImage, signedUrl } from '@/lib/profile-uploads';
import { GlassBg } from '@/components/Glass';
import { Press, FadeIn } from '@/components/Press';
import { SecureNote } from '@/components/ListKit';
import { colors } from '@/theme/tokens';
import { Field, PrimaryButton } from './_ui';

/** The admin's own profile: avatar, name, sign-out. Lives in its own tab. */
export default function AdminProfile() {
  const insets = useSafeAreaInsets();
  const { session, profile, refresh } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.avatar_path) signedUrl(profile.avatar_path).then(setAvatarUrl);
  }, [profile?.avatar_path]);
  useEffect(() => { setFullName(profile?.full_name ?? ''); }, [profile?.full_name]);

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

  async function save() {
    const name = fullName.trim();
    if (!name) return Alert.alert('Name required', 'Please enter your full name.');
    setSaving(true);
    try {
      await updateMyProfile({ full_name: name });
      await refresh();
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) { Alert.alert('Save failed', (e as Error).message); } finally { setSaving(false); }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/sign-in');
  }

  const name = profile?.full_name || session?.user.email?.split('@')[0] || 'Admin';
  const dirty = fullName.trim() !== (profile?.full_name ?? '').trim();

  return (
    <View className="flex-1">
      <GlassBg />
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: insets.bottom + 110 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text className="mb-5 text-[26px] font-semibold text-ink">Profile</Text>

          {/* Identity card */}
          <FadeIn>
            <View className="mb-5 flex-row items-center gap-4 rounded-apple border border-hairline bg-surface p-4">
              <Pressable onPress={pickAndUpload} className="h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-full bg-accent">
                {avatarUrl
                  ? <Image source={{ uri: avatarUrl }} style={{ width: 64, height: 64 }} contentFit="cover" />
                  : <Text className="text-[24px] font-semibold" style={{ color: colors.onAccent }}>{name.charAt(0).toUpperCase()}</Text>}
                <View className="absolute bottom-0 right-0 h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-hairline bg-surface2">
                  {uploading ? <ActivityIndicator size="small" color={colors.ink} /> : <Camera size={11} color={colors.ink} />}
                </View>
              </Pressable>
              <View className="flex-1">
                <Text className="text-[19px] font-semibold text-ink" numberOfLines={1}>{name}</Text>
                <Text className="text-[13px] text-graphite" numberOfLines={1}>{session?.user.email}</Text>
                <View className="mt-1.5 flex-row items-center gap-1.5">
                  <View className="rounded-full bg-accent px-2 py-0.5">
                    <Text className="text-[11.5px] font-semibold" style={{ color: colors.onAccent }}>Admin</Text>
                  </View>
                  {profile?.ref_code ? <Text className="text-[11.5px] text-graphite-light">{profile.ref_code}</Text> : null}
                </View>
              </View>
            </View>
          </FadeIn>

          {/* Details */}
          <FadeIn delay={40}>
            <View className="mb-5 gap-4 rounded-apple border border-hairline bg-surface p-4">
              <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your name" autoCapitalize="words" />
              <View>
                <Text className="mb-1.5 text-[13px] font-medium text-graphite">Email</Text>
                <View className="rounded-2xl border border-hairline bg-surface2 px-4 py-3.5">
                  <Text className="text-base text-graphite" numberOfLines={1}>{session?.user.email ?? '—'}</Text>
                </View>
              </View>
              <View>
                <PrimaryButton label="Save changes" onPress={save} busy={saving} disabled={!dirty} />
                <SecureNote />
              </View>
            </View>
          </FadeIn>

          {/* Sign out */}
          <FadeIn delay={80}>
            <Press onPress={signOut} className="h-[50px] flex-row items-center justify-center gap-2 rounded-full border border-hairline bg-surface">
              <LogOut size={18} color={colors.ink} />
              <Text className="text-[15px] font-semibold text-ink">Sign out</Text>
            </Press>
          </FadeIn>

          {/* Legal */}
          <View className="mt-6 flex-row items-center justify-center gap-2">
            <Pressable onPress={() => router.push('/privacy')} hitSlop={8}><Text className="text-[12.5px] text-graphite-light">Privacy Policy</Text></Pressable>
            <Text className="text-[12.5px] text-graphite-light">·</Text>
            <Pressable onPress={() => router.push('/terms')} hitSlop={8}><Text className="text-[12.5px] text-graphite-light">Terms</Text></Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
