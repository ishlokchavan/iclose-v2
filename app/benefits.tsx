import { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X, Check, ShoppingBag, Briefcase } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { Wordmark } from '@/components/DealUI';
import { Press, FadeIn } from '@/components/Press';
import { ROLE_BENEFITS } from '@/data/benefits';
import { IMAGES } from '@/data/images';
import { colors } from '@/theme/tokens';
import type { UserRole } from '@/lib/deals';

const ROLE_ICON: Record<UserRole, typeof ShoppingBag> = { buyer: ShoppingBag, broker: Briefcase, seller: Briefcase };

export default function Benefits() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [role, setRole] = useState<UserRole | null>(profile?.role ?? null);

  // Pre-login: fall back to the role picked in the intro.
  useEffect(() => {
    if (profile?.role) { setRole(profile.role); return; }
    AsyncStorage.getItem('intent_role').then((r) => setRole(r === 'broker' ? 'broker' : 'buyer'));
  }, [profile]);

  const b = role ? ROLE_BENEFITS[role] : ROLE_BENEFITS.buyer;
  const Icon = ROLE_ICON[b.role];

  return (
    <View className="flex-1 bg-surface">
      <View style={{ height: 230 }}>
        <Image source={{ uri: IMAGES.hero }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={300} />
        <LinearGradient colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.15)', '#000000']} locations={[0, 0.5, 1]} style={{ position: 'absolute', inset: 0 }} />
        <Press onPress={() => router.back()} style={{ position: 'absolute', top: insets.top + 8, right: 16 }} className="h-9 w-9 items-center justify-center rounded-full bg-black/30"><X size={20} color="#fff" /></Press>
        <View style={{ position: 'absolute', left: 20, bottom: 20, right: 20 }}>
          <View className="mb-2 flex-row items-center self-start rounded-full bg-surface px-2.5 py-1"><Wordmark size={17} /></View>
          <Text className="text-[26px] font-bold leading-[1.1] text-white">{b.headline}</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: insets.bottom + 32 }}>
        <Text className="mb-5 px-1 text-[15px] text-graphite">One flat fee. Zero commission. Here's exactly what you pay — and what you get as a {b.title.toLowerCase().replace(/s$/, '')}.</Text>

        <View className="overflow-hidden rounded-[24px] border border-hairline bg-surface" style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } }}>
          <LinearGradient colors={['rgba(158,255,0,0.10)', 'rgba(158,255,0,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
          <View className="flex-row items-center gap-3 px-5 pt-5">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-accent/12"><Icon size={24} color={colors.accent} /></View>
            <Text className="flex-1 text-[20px] font-bold text-ink">{b.title}</Text>
          </View>
          <View className="flex-row items-end gap-1.5 px-5 pt-5">
            <Text className="text-[40px] font-bold leading-none text-accent">{b.fee}</Text>
            <Text className="mb-1.5 text-[13px] text-graphite">{b.feeLabel}</Text>
          </View>
          <View className="gap-3 px-5 pb-6 pt-5">
            {b.points.map((p, i) => (
              <FadeIn key={i} delay={i * 40}>
                <View className="flex-row items-start gap-3">
                  <View className="mt-0.5 h-[22px] w-[22px] items-center justify-center rounded-full bg-accent"><Check size={14} color={colors.onAccent} /></View>
                  <Text className="flex-1 text-[15.5px] leading-snug text-ink">{p}</Text>
                </View>
              </FadeIn>
            ))}
            {b.fine ? <Text className="mt-1 text-[11.5px] leading-snug text-graphite-light">{b.fine}</Text> : null}
          </View>
        </View>

        <View className="mt-6 items-center rounded-apple bg-mist px-5 py-5">
          <Text className="text-center text-[15px] font-semibold text-ink">Ready to save?</Text>
          <Text className="mb-3 mt-1 text-center text-[13.5px] text-graphite">Submit an inquiry — our team takes it from there.</Text>
          <Press onPress={() => router.back()} className="rounded-full bg-accent px-8 py-3"><Text className="text-[15px] font-semibold" style={{ color: colors.onAccent }}>Got it</Text></Press>
        </View>
      </ScrollView>
    </View>
  );
}
