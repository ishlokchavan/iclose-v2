import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check, ShoppingBag, Briefcase } from 'lucide-react-native';
import { Wordmark } from '@/components/DealUI';
import { ROLE_BENEFITS, VISIBLE_ROLES } from '@/data/benefits';
import { IMAGES } from '@/data/images';
import { colors } from '@/theme/tokens';
import type { UserRole } from '@/lib/deals';

const ROLE_ICON: Record<UserRole, typeof ShoppingBag> = { buyer: ShoppingBag, broker: Briefcase, seller: Briefcase };

export default function Benefits() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-white">
      {/* Hero */}
      <View style={{ height: 230 }}>
        <Image source={{ uri: IMAGES.hero }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={300} />
        <LinearGradient colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.15)', 'rgba(255,255,255,1)']} locations={[0, 0.5, 1]} style={{ position: 'absolute', inset: 0 }} />
        <Pressable onPress={() => router.back()} style={{ position: 'absolute', top: insets.top + 8, right: 16 }} className="h-9 w-9 items-center justify-center rounded-full bg-black/30"><X size={20} color="#fff" /></Pressable>
        <View style={{ position: 'absolute', left: 20, bottom: 20, right: 20 }}>
          <View className="mb-2 flex-row items-center rounded-full bg-white/90 px-2.5 py-1 self-start"><Wordmark size={17} /></View>
          <Text className="text-[26px] font-bold leading-[1.1] text-white">Never pay commission to buy or close again.</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 32 }}>
        <Text className="mb-5 px-1 text-[15px] text-graphite">One flat fee. Zero commission. Here’s exactly what you pay — and what you get.</Text>

        <View className="gap-4">
          {VISIBLE_ROLES.map((r) => {
            const b = ROLE_BENEFITS[r];
            const Icon = ROLE_ICON[r];
            return (
              <View key={r} className="overflow-hidden rounded-[22px] border border-white/70 bg-white" style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } }}>
                <LinearGradient colors={['rgba(0,113,227,0.10)', 'rgba(0,113,227,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
                <View className="flex-row items-center gap-3 px-5 pt-5">
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-accent/12"><Icon size={22} color={colors.accent} /></View>
                  <Text className="flex-1 text-[19px] font-bold text-ink">{b.title}</Text>
                </View>
                <View className="flex-row items-end gap-1.5 px-5 pt-4">
                  <Text className="text-[34px] font-bold leading-none text-accent">{b.fee}</Text>
                  <Text className="mb-1 text-[13px] text-graphite">{b.feeLabel}</Text>
                </View>
                <View className="gap-2.5 px-5 pb-5 pt-4">
                  {b.points.map((p, i) => (
                    <View key={i} className="flex-row items-start gap-2.5">
                      <View className="mt-0.5 h-[20px] w-[20px] items-center justify-center rounded-full bg-accent"><Check size={13} color="#fff" /></View>
                      <Text className="flex-1 text-[15px] leading-snug text-ink">{p}</Text>
                    </View>
                  ))}
                  {b.fine ? <Text className="mt-1 text-[11.5px] leading-snug text-graphite-light">{b.fine}</Text> : null}
                </View>
              </View>
            );
          })}
        </View>

        <View className="mt-6 items-center rounded-apple bg-mist px-5 py-5">
          <Text className="text-center text-[15px] font-semibold text-ink">Ready to save?</Text>
          <Text className="mt-1 mb-3 text-center text-[13.5px] text-graphite">Submit an inquiry — our team takes it from there.</Text>
          <Pressable onPress={() => router.back()} className="rounded-full bg-ink px-8 py-3"><Text className="text-[15px] font-semibold text-white">Got it</Text></Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
