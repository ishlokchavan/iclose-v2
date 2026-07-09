import { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Sparkles, Plus, MessagesSquare, TrendingUp, UserRound, Banknote,
  LayoutDashboard, Inbox, Users, Settings2, type LucideIcon,
} from 'lucide-react-native';
import { Press } from '@/components/Press';
import { colors } from '@/theme/tokens';

/**
 * First-run guided tour — a self-managing bottom-card walkthrough.
 * Mount it anywhere: it checks AsyncStorage[storageKey] on mount and only
 * shows itself once. Done/Skip persists the key so it never reappears.
 */
export interface TourStep {
  icon: LucideIcon;
  title: string;
  body: string;
}

export function Tour({ steps, storageKey }: { steps: TourStep[]; storageKey: string }) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    AsyncStorage.getItem(storageKey)
      .then((seen) => {
        if (seen || !alive) return;
        timer = setTimeout(() => { if (alive) setVisible(true); }, 600);
      })
      .catch(() => {});
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [storageKey]);

  function go(next: number) {
    Animated.timing(anim, { toValue: 0, duration: 110, useNativeDriver: true }).start(() => {
      setStep(next);
      Animated.timing(anim, { toValue: 1, duration: 190, useNativeDriver: true }).start();
    });
  }

  function dismiss() {
    setVisible(false);
    AsyncStorage.setItem(storageKey, '1').catch(() => {});
  }

  if (!visible) return null;

  const last = step === steps.length - 1;
  const s = steps[step];
  const Icon = s.icon;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}>
        <View
          className="mx-4 rounded-[24px] border border-hairline bg-surface p-6"
          style={{ marginBottom: insets.bottom + 16 }}
        >
          <Animated.View
            style={{
              opacity: anim,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
            }}
          >
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-[18px] bg-accent/10">
              <Icon size={26} color={colors.accent} strokeWidth={1.75} />
            </View>
            <Text className="mb-1.5 text-[20px] font-semibold leading-tight text-ink">{s.title}</Text>
            <Text className="text-[14.5px] leading-relaxed text-graphite">{s.body}</Text>
          </Animated.View>

          {/* Progress dots */}
          <View className="mb-5 mt-5 flex-row items-center gap-2">
            {steps.map((_, i) => (
              <View
                key={i}
                className="h-[6px] rounded-full"
                style={{ width: i === step ? 20 : 6, backgroundColor: i === step ? colors.accent : colors.hairline }}
              />
            ))}
          </View>

          <View className="flex-row items-center gap-2.5">
            {step > 0 ? (
              <Press onPress={() => go(step - 1)} className="rounded-full border border-hairline bg-surface2 px-5 py-3">
                <Text className="text-[14.5px] font-semibold text-ink">Back</Text>
              </Press>
            ) : null}
            <Press onPress={() => (last ? dismiss() : go(step + 1))} className="flex-1 rounded-full bg-accent py-3">
              <Text className="text-center text-[15px] font-semibold" style={{ color: colors.onAccent }}>
                {last ? 'Done' : 'Next'}
              </Text>
            </Press>
          </View>
          <Pressable onPress={dismiss} className="mt-3 py-1">
            <Text className="text-center text-[13px] font-medium text-graphite">Skip tour</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ---- Role step sets ---------------------------------------------------------

export const BUYER_TOUR: TourStep[] = [
  { icon: Sparkles, title: 'Welcome to iClose.', body: 'Buy without paying commission — just one flat AED 8,250 conveyance fee. Here’s a 20-second tour.' },
  { icon: Plus, title: 'Submit an inquiry', body: 'Tap ＋ and tell us what you want to buy. It takes a minute.' },
  { icon: MessagesSquare, title: 'We handle it', body: 'Our team works your purchase with you on WhatsApp or a call. Watch the status update here.' },
  { icon: TrendingUp, title: 'Track your savings', body: 'The Home hero shows commission you’ve avoided; History keeps every inquiry in one place.' },
  { icon: UserRound, title: 'Your account', body: 'Find your account manager, documents, and bank details for any payouts or refunds under Account.' },
];

export const BROKER_TOUR: TourStep[] = [
  { icon: Sparkles, title: 'Welcome to iClose.', body: 'Save 100% of your commission — close deals for a flat AED 3,500 admin fee. Quick tour?' },
  { icon: Plus, title: 'Submit a deal', body: 'Tap ＋ and send us the deal details — secondary or off-plan.' },
  { icon: MessagesSquare, title: 'We process it with you', body: 'Our team runs the paperwork alongside you, plus priority EOI booking on select developers.' },
  { icon: Banknote, title: 'Track commission & payouts', body: 'Home and History show every deal and your commission moving from pending to paid.' },
  { icon: UserRound, title: 'Your account', body: 'Add bank accounts for payouts and keep your documents up to date under Account.' },
];

export const ADMIN_TOUR: TourStep[] = [
  { icon: Sparkles, title: 'Welcome to the console', body: 'Everything you need to run iClose — deals, users, and payouts in one place.' },
  { icon: LayoutDashboard, title: 'Dashboard & needs attention', body: 'KPIs up top; untouched inquiries and payouts due surface here automatically.' },
  { icon: Inbox, title: 'Inquiries', body: 'Open any inquiry to update status or commission — the user gets notified automatically.' },
  { icon: Users, title: 'Users & managers', body: 'Browse users, assign account managers, and review profiles from the Users tab.' },
  { icon: Settings2, title: 'Manage hub', body: 'Settings, FAQs, the email log, and the audit trail all live under Manage.' },
];
