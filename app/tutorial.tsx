import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PencilLine, MessagesSquare, LineChart, BadgeCheck, Sparkles, type LucideIcon } from 'lucide-react-native';
import { GlassBg } from '@/components/Glass';
import { Wordmark } from '@/components/DealUI';
import { useAuth } from '@/lib/auth';
import { ROLE_BENEFITS } from '@/data/benefits';
import { colors } from '@/theme/tokens';

/**
 * Role-aware "How iClose works" tutorial. Buyers get the "never pay
 * commission" story; brokers get "save 100% of your commission". Role comes
 * from the profile when signed in, else the pre-auth 'intent_role' choice.
 */
type Step = { icon: LucideIcon; title: string; body: string };

const BUYER_STEPS: Step[] = [
  { icon: Sparkles, title: ROLE_BENEFITS.buyer.headline, body: 'iClose replaces agent commission with one flat AED 8,250 conveyance fee. Here’s how it works.' },
  { icon: PencilLine, title: 'Tell us what you want to buy', body: 'Area, budget, property type — share it in a minute and we take it from there.' },
  { icon: MessagesSquare, title: 'We handle it for you', body: 'Our team works your purchase with you on WhatsApp or a call. 0% commission on secondary, up to 12% credit back on off-plan.' },
  { icon: LineChart, title: 'Track everything in the app', body: 'Watch every inquiry move from submitted to closed, with the commission you’re saving always visible.' },
];

const BROKER_STEPS: Step[] = [
  { icon: Sparkles, title: ROLE_BENEFITS.broker.headline, body: 'Close your deals through iClose and keep every dirham of commission for a flat AED 3,500 admin fee.' },
  { icon: PencilLine, title: 'Submit your deal', body: 'Secondary or off-plan — send us the deal details in a minute.' },
  { icon: MessagesSquare, title: 'We process it with you', body: 'Our team runs the paperwork alongside you. You keep 100% of the commission, plus priority EOI booking.' },
  { icon: BadgeCheck, title: 'Track deals & payouts', body: 'Follow each deal from submitted to closed and watch your commission move from pending to paid.' },
];

export default function Tutorial() {
  const insets = useSafeAreaInsets();
  const { profile, session } = useAuth();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const [role, setRole] = useState<'buyer' | 'broker'>(profile?.role === 'broker' ? 'broker' : 'buyer');
  const scroller = useRef<ScrollView>(null);

  // No profile yet (pre-auth)? Fall back to the intent picked on the welcome screen.
  useEffect(() => {
    if (profile?.role) {
      setRole(profile.role === 'broker' ? 'broker' : 'buyer');
      return;
    }
    let alive = true;
    AsyncStorage.getItem('intent_role')
      .then((v) => { if (alive && v === 'broker') setRole('broker'); })
      .catch(() => {});
    return () => { alive = false; };
  }, [profile?.role]);

  const steps = role === 'broker' ? BROKER_STEPS : BUYER_STEPS;
  const last = page === steps.length - 1;

  async function finish() {
    await AsyncStorage.setItem('seen_tutorial', '1');
    // Opened from inside the app (replay "How iClose works") → go back to where
    // we came from. Pre-auth first run → continue to sign-in.
    if (session) {
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } else {
      router.replace('/sign-in');
    }
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
        {steps.map((s, i) => {
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
          {steps.map((_, i) => (
            <View key={i} style={{ width: i === page ? 22 : 7, backgroundColor: i === page ? colors.accent : colors.hairline }} className="h-[7px] rounded-full" />
          ))}
        </View>
        <Pressable onPress={next} className="rounded-full bg-accent py-4">
          <Text className="text-center text-[16px] font-semibold" style={{ color: colors.onAccent }}>{last ? 'Get started' : 'Next'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
