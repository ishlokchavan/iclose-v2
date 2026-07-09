import { useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BadgePercent, MessagesSquare, LineChart, ShoppingBag, Briefcase, Check } from 'lucide-react-native';
import { GlassBg } from '@/components/Glass';
import { Wordmark } from '@/components/DealUI';
import { colors } from '@/theme/tokens';
import type { UserRole } from '@/lib/deals';

const SLIDES = [
  { icon: BadgePercent, title: 'Never pay commission', body: 'Buy, sell or close deals in the UAE for one flat fee — no commission, ever.' },
  { icon: MessagesSquare, title: 'We do the heavy lifting', body: 'Submit what you want and our team works it with you on WhatsApp, call or Telegram.' },
  { icon: LineChart, title: 'Track everything', body: 'Follow every deal from submitted to closed — with your savings and commission always visible.' },
] as const;

const ROLES: { key: UserRole; icon: typeof ShoppingBag; label: string; sub: string }[] = [
  { key: 'buyer', icon: ShoppingBag, label: 'I want to buy', sub: 'Find a home & skip the commission' },
  { key: 'broker', icon: Briefcase, label: 'I’m a broker', sub: 'Close deals & keep 100% commission' },
];

export default function Intro() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const [phase, setPhase] = useState<'slides' | 'role'>('slides');
  const [role, setRole] = useState<UserRole | null>(null);
  const scroller = useRef<ScrollView>(null);

  async function finish(chosen: UserRole) {
    await AsyncStorage.multiSet([['intent_role', chosen], ['seen_intro', '1']]);
    router.replace('/sign-in');
  }

  const last = page === SLIDES.length - 1;
  function next() {
    if (last) return setPhase('role');
    scroller.current?.scrollTo({ x: (page + 1) * width, animated: true });
  }

  if (phase === 'role') {
    return (
      <View className="flex-1">
        <GlassBg />
        <View style={{ paddingTop: insets.top + 40 }} className="flex-1 px-6">
          <View className="items-center"><Wordmark size={28} /></View>
          <Text className="mb-1 mt-8 text-[26px] font-bold text-ink">What brings you here?</Text>
          <Text className="mb-6 text-[15px] text-graphite">We’ll tailor iClose to you.</Text>
          <View className="gap-3">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const active = role === r.key;
              return (
                <Pressable key={r.key} onPress={() => setRole(r.key)} className={`flex-row items-center gap-3 rounded-apple border p-4 ${active ? 'border-accent bg-accent/8' : 'border-hairline bg-surface'}`}>
                  <View className={`h-12 w-12 items-center justify-center rounded-full ${active ? 'bg-accent' : 'bg-mist'}`}><Icon size={24} color={active ? colors.onAccent : colors.graphite} /></View>
                  <View className="flex-1">
                    <Text className={`text-[16px] font-semibold ${active ? 'text-accent' : 'text-ink'}`}>{r.label}</Text>
                    <Text className="text-[12.5px] text-graphite">{r.sub}</Text>
                  </View>
                  <View className={`h-6 w-6 items-center justify-center rounded-full border ${active ? 'border-accent bg-accent' : 'border-hairline'}`}>{active ? <Check size={15} color={colors.onAccent} /> : null}</View>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={{ paddingBottom: insets.bottom + 20 }} className="px-6">
          <Pressable disabled={!role} onPress={() => role && finish(role)} className={`h-[54px] items-center justify-center rounded-full ${role ? 'bg-accent' : 'bg-accent/30'}`}>
            <Text className="text-[16px] font-semibold" style={{ color: colors.onAccent }}>Continue</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center justify-between px-6">
        <Wordmark size={24} />
        <Pressable onPress={() => setPhase('role')}><Text className="text-[15px] font-medium text-graphite">Skip</Text></Pressable>
      </View>
      <ScrollView ref={scroller} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))} className="flex-1">
        {SLIDES.map((s, i) => {
          const Icon = s.icon;
          return (
            <View key={i} style={{ width }} className="flex-1 items-center justify-center px-10">
              <View className="mb-8 h-28 w-28 items-center justify-center rounded-[32px] bg-accent/10"><Icon size={52} color={colors.accent} strokeWidth={1.6} /></View>
              <Text className="mb-3 text-center text-[27px] font-bold leading-tight text-ink">{s.title}</Text>
              <Text className="max-w-[330px] text-center text-[16px] leading-relaxed text-graphite">{s.body}</Text>
            </View>
          );
        })}
      </ScrollView>
      <View style={{ paddingBottom: insets.bottom + 20 }} className="px-6">
        <View className="mb-6 flex-row items-center justify-center gap-2">
          {SLIDES.map((_, i) => <View key={i} style={{ width: i === page ? 22 : 7, backgroundColor: i === page ? colors.accent : colors.hairline }} className="h-[7px] rounded-full" />)}
        </View>
        <Pressable onPress={next} className="h-[54px] items-center justify-center rounded-full bg-accent">
          <Text className="text-[16px] font-semibold" style={{ color: colors.onAccent }}>{last ? 'Get started' : 'Next'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
