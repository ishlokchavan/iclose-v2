import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, FlatList, Dimensions, Modal } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, Home, Coins, ArrowLeftRight } from 'lucide-react-native';
import { colors } from '@/theme/tokens';

const KEY = 'iclose.shares.intro.v1';
const CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_373qi3JTSvYmXjqMPJT9idOjFt7';
const { width } = Dimensions.get('window');

const SLIDES = [
  {
    img: `${CDN}/hf_20260617_003721_84f0c343-e903-4323-a3da-3cc2b40e1caf.png`,
    Icon: Home, title: 'Own a slice of Dubai real estate',
    line: 'Buy a small share of a real, rented home — starting from just AED 500. No mortgage, no agent.',
  },
  {
    img: `${CDN}/hf_20260617_003744_5e42a364-7075-48e6-b157-892501c6d8fd.png`,
    Icon: Coins, title: 'Earn rent every month',
    line: 'The home is rented out. Your share of the rent gets paid straight into your wallet — month after month.',
  },
  {
    img: `${CDN}/hf_20260617_002613_eb69892f-76ef-47ca-a325-f100e334818b.png`,
    Icon: ArrowLeftRight, title: 'Sell whenever you like',
    line: 'Changed your mind? Sell your shares to other investors anytime. You’re never locked in.',
  },
];

/** First-run explainer for the Shares tab — shown once, dead simple. */
export function SharesIntro() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState<boolean | null>(null);
  const [idx, setIdx] = useState(0);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => setOpen(!v)).catch(() => setOpen(false));
  }, []);

  if (!open) return null;

  function finish() {
    AsyncStorage.setItem(KEY, '1').catch(() => {});
    setOpen(false);
  }
  function go(n: number) {
    listRef.current?.scrollToOffset({ offset: n * width, animated: true });
    setIdx(n);
  }
  const last = idx === SLIDES.length - 1;

  return (
    <Modal visible animationType="fade" onRequestClose={finish} statusBarTranslucent>
    <View className="flex-1 bg-paper">
      <View style={{ position: 'absolute', top: insets.top + 12, left: 20, right: 20, zIndex: 10 }} className="flex-row items-center gap-3">
        <View className="flex-1 flex-row gap-1.5">
          {SLIDES.map((_, i) => (
            <View key={i} style={{ height: 3, flex: 1, borderRadius: 2 }} className={i <= idx ? 'bg-ink' : 'bg-ink/10'} />
          ))}
        </View>
        <Pressable onPress={finish}><Text className="text-[13px] font-medium text-ink/40">Skip</Text></Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width }} className="flex-1">
            <View style={{ paddingTop: insets.top + 56 }} className="px-7">
              <View style={{ height: 320 }} className="overflow-hidden rounded-[28px]">
                <Image source={{ uri: item.img }} style={{ position: 'absolute', width: '100%', height: '100%' }} contentFit="cover" />
                <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']} style={{ position: 'absolute', width: '100%', height: '100%' }} />
                <View className="absolute left-5 top-5 h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                  <item.Icon size={24} color="#fff" />
                </View>
              </View>
              <Text className="mt-7 text-[28px] font-semibold leading-tight text-ink">{item.title}</Text>
              <Text className="mt-3 text-[15.5px] leading-6 text-ink/55">{item.line}</Text>
            </View>
          </View>
        )}
      />

      <View style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 20 }}>
        <Pressable onPress={() => (last ? finish() : go(idx + 1))} className="flex-row items-center justify-center gap-2 rounded-full bg-ink py-4">
          <Text className="text-base font-semibold text-white">{last ? 'Start exploring' : 'Next'}</Text>
          <ArrowRight size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
    </Modal>
  );
}
