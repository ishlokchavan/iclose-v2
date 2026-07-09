import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ChevronDown } from 'lucide-react-native';
import { GlassBg } from '@/components/Glass';
import { getFaqs, type Faq } from '@/lib/deals';
import { colors } from '@/theme/tokens';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function FaqScreen() {
  const insets = useSafeAreaInsets();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => { getFaqs().then(setFaqs); }, []);

  function toggle(id: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((cur) => (cur === id ? null : id));
  }

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center justify-between px-4 pb-2">
        <Text className="text-[17px] font-semibold text-ink">FAQ</Text>
        <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-full bg-surface2"><X size={20} color={colors.ink} /></Pressable>
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
        <View className="gap-3">
          {faqs.map((f) => (
            <Pressable key={f.id} onPress={() => toggle(f.id)} className="rounded-apple border border-hairline bg-surface p-4">
              <View className="flex-row items-center justify-between gap-3">
                <Text className="flex-1 text-[15.5px] font-semibold text-ink">{f.question}</Text>
                <ChevronDown size={18} color={colors.graphiteLight} style={{ transform: [{ rotate: open === f.id ? '180deg' : '0deg' }] }} />
              </View>
              {open === f.id ? <Text className="mt-2.5 text-[14.5px] leading-relaxed text-graphite">{f.answer}</Text> : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
