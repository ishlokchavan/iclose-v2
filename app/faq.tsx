import { useEffect, useState } from 'react';
import { View, Text, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X, ChevronDown } from 'lucide-react-native';
import { GlassBg } from '@/components/Glass';
import { Press, FadeIn } from '@/components/Press';
import { useAuth } from '@/lib/auth';
import { getFaqs, type Faq, type UserRole } from '@/lib/deals';
import { colors } from '@/theme/tokens';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function FaqScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      let role: UserRole | undefined = profile?.role;
      if (!role) {
        const stored = await AsyncStorage.getItem('intent_role');
        role = stored === 'broker' ? 'broker' : stored === 'buyer' ? 'buyer' : undefined;
      }
      const rows = await getFaqs(role);
      if (alive) setFaqs(rows);
    })();
    return () => { alive = false; };
  }, [profile?.role]);

  function toggle(id: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((cur) => (cur === id ? null : id));
  }

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center justify-between px-4 pb-2">
        <Text className="text-[17px] font-semibold text-ink">FAQ</Text>
        <Press onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-full bg-surface2"><X size={20} color={colors.ink} /></Press>
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
        <View className="gap-3">
          {faqs.map((f, i) => (
            <FadeIn key={f.id} delay={i * 40}>
              <Press onPress={() => toggle(f.id)} className="rounded-apple border border-hairline bg-surface p-4">
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="flex-1 text-[15.5px] font-semibold text-ink">{f.question}</Text>
                  <ChevronDown size={18} color={colors.graphiteLight} style={{ transform: [{ rotate: open === f.id ? '180deg' : '0deg' }] }} />
                </View>
                {open === f.id ? <Text className="mt-2.5 text-[14.5px] leading-relaxed text-graphite">{f.answer}</Text> : null}
              </Press>
            </FadeIn>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
