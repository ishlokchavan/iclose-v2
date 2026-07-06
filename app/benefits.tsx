import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check } from 'lucide-react-native';
import { GlassBg } from '@/components/Glass';
import { Wordmark } from '@/components/DealUI';
import { HEADLINE, ROLE_BENEFITS, ROLE_ORDER } from '@/data/benefits';
import { colors } from '@/theme/tokens';

/** The value proposition, in our light brand — 3 roles, their fee, what they get. */
export default function Benefits() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center justify-between px-4 pb-2">
        <Wordmark size={22} />
        <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-full bg-black/5"><X size={20} color={colors.ink} /></Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
        <Text className="mt-2 px-1 text-[30px] font-bold leading-[1.05] tracking-tight text-ink">
          Never pay commission to <Text className="text-accent">buy, sell or close</Text> again.
        </Text>
        <Text className="mb-6 mt-3 px-1 text-[15px] text-graphite">One flat fee. No commission. Here’s what you pay — and what you get.</Text>

        <View className="gap-4">
          {ROLE_ORDER.map((r) => {
            const b = ROLE_BENEFITS[r];
            return (
              <View key={r} className="overflow-hidden rounded-apple border border-white/60 bg-white/75">
                <View className="flex-row items-baseline justify-between px-5 pt-4">
                  <Text className="text-[18px] font-bold text-ink">{b.title}</Text>
                  <View className="items-end">
                    <Text className="text-[20px] font-bold text-accent">{b.fee}</Text>
                    <Text className="text-[11.5px] text-graphite">{b.feeLabel}</Text>
                  </View>
                </View>
                <View className="gap-2 px-5 pb-4 pt-3">
                  {b.points.map((p, i) => (
                    <View key={i} className="flex-row items-start gap-2.5">
                      <View className="mt-0.5 h-[18px] w-[18px] items-center justify-center rounded-full bg-accent/12"><Check size={12} color={colors.accent} /></View>
                      <Text className="flex-1 text-[14.5px] leading-snug text-ink">{p}</Text>
                    </View>
                  ))}
                  {b.fine ? <Text className="mt-1 text-[11.5px] leading-snug text-graphite-light">{b.fine}</Text> : null}
                </View>
              </View>
            );
          })}
        </View>

        <Text className="mt-6 px-2 text-center text-[13px] text-graphite">Submit an inquiry in the app — our team takes it from there.</Text>
      </ScrollView>
    </View>
  );
}
