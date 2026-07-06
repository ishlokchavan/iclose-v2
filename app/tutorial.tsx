import { useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PencilLine, MessagesSquare, LineChart, BadgeCheck } from 'lucide-react-native';
import { GlassBg } from '@/components/Glass';
import { Wordmark } from '@/components/DealUI';
import { colors } from '@/theme/tokens';

const STEPS = [
  { icon: PencilLine, title: 'Tell us what you want', body: 'Buying, selling, or closing a deal — tell us in a minute. Never pay commission again; just one flat fee.' },
  { icon: MessagesSquare, title: 'We handle it for you', body: 'Our team picks it up and works your deal directly with you — on WhatsApp, a call, or Telegram.' },
  { icon: LineChart, title: 'Track everything live', body: 'Watch each deal move from submitted to closed right here, with your commission and its status always visible.' },
  { icon: BadgeCheck, title: 'Get paid', body: 'When a deal closes, your commission appears in your dashboard — pending, then paid. No chasing.' },
] as const;

export default function Tutorial() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const last = page === STEPS.length - 1;

  async function finish() {
    await AsyncStorage.setItem('seen_tutorial', '1');
    router.replace('/sign-in');
  }

  function next() {
    if (last) return finish();
    scroller.current?.scrollTo({ x: (page + 1) * width, animated: true });
  }

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center justify-between px-6">
        <Wordmark size={24} />
        <Pressable onPress={finish}><Text className="text-[15px] font-medium text-graphite">Skip</Text></Pressable>
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        className="flex-1"
      >
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <View key={i} style={{ width }} className="flex-1 items-center justify-center px-10">
              <View className="mb-8 h-24 w-24 items-center justify-center rounded-[28px] bg-accent/10">
                <Icon size={44} color={colors.accent} strokeWidth={1.75} />
              </View>
              <Text className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-accent">Step {i + 1}</Text>
              <Text className="mb-3 text-center text-[26px] font-semibold leading-tight text-ink">{s.title}</Text>
              <Text className="max-w-[320px] text-center text-[16px] leading-relaxed text-graphite">{s.body}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + 20 }} className="px-6">
        <View className="mb-6 flex-row items-center justify-center gap-2">
          {STEPS.map((_, i) => (
            <View key={i} style={{ width: i === page ? 22 : 7, backgroundColor: i === page ? colors.accent : colors.hairline }} className="h-[7px] rounded-full" />
          ))}
        </View>
        <Pressable onPress={next} className="rounded-full bg-ink py-4">
          <Text className="text-center text-[16px] font-semibold text-white">{last ? 'Get started' : 'Next'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
