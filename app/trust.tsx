import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Shield, Eye, FileText, Wallet, Lock, Headphones, type LucideIcon } from 'lucide-react-native';
import { GlassBg } from '@/components/Glass';
import { Press, FadeIn } from '@/components/Press';
import { Wordmark } from '@/components/DealUI';
import { TRUST_POINTS, TRUST_HEADLINE, TRUST_SUB, type TrustPoint } from '@/data/trust';
import { colors } from '@/theme/tokens';

const ICON: Record<TrustPoint['icon'], LucideIcon> = {
  shield: Shield, eye: Eye, file: FileText, wallet: Wallet, lock: Lock, headset: Headphones,
};

export default function Trust() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center justify-between px-5 pb-2">
        <View className="flex-row items-center gap-2"><Shield size={18} color={colors.accent} /><Wordmark size={18} /></View>
        <Press onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-full bg-surface2"><X size={19} color={colors.ink} /></Press>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        <View className="overflow-hidden rounded-[24px] border border-hairline">
          <LinearGradient colors={['rgba(158,255,0,0.14)', 'rgba(158,255,0,0.02)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 22 }}>
            <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-accent/15"><Shield size={26} color={colors.accent} /></View>
            <Text className="text-[28px] font-bold leading-[1.1] text-ink">{TRUST_HEADLINE}</Text>
            <Text className="mt-2 text-[14.5px] leading-relaxed text-graphite">{TRUST_SUB}</Text>
          </LinearGradient>
        </View>

        <View className="mt-4 gap-2.5">
          {TRUST_POINTS.map((p, i) => {
            const Icon = ICON[p.icon];
            return (
              <FadeIn key={p.title} delay={Math.min(i, 8) * 40}>
                <View className="flex-row gap-3.5 rounded-apple border border-hairline bg-surface p-4">
                  <View className="h-10 w-10 items-center justify-center rounded-2xl bg-surface2"><Icon size={20} color={colors.accent} /></View>
                  <View className="flex-1">
                    <Text className="text-[15.5px] font-semibold text-ink">{p.title}</Text>
                    <Text className="mt-0.5 text-[13.5px] leading-relaxed text-graphite">{p.body}</Text>
                  </View>
                </View>
              </FadeIn>
            );
          })}
        </View>

        <View className="mt-6 items-center rounded-apple bg-mist px-5 py-5">
          <Text className="text-center text-[15px] font-semibold text-ink">Still have a question?</Text>
          <Text className="mb-3 mt-1 text-center text-[13.5px] text-graphite">Ask our team directly — we’d rather you feel sure.</Text>
          <Press onPress={() => router.push('/faq')} className="rounded-full bg-accent px-8 py-3"><Text className="text-[15px] font-semibold" style={{ color: colors.onAccent }}>Read the FAQ</Text></Press>
        </View>
      </ScrollView>
    </View>
  );
}
