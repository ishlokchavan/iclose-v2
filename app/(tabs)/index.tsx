import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, Dimensions, Pressable, RefreshControl, type ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, Heart } from 'lucide-react-native';
import { useExperience } from '@/store/experience';
import { useSaved } from '@/store/saved';
import { useSignals } from '@/store/signals';
import { PropertyFeedCard } from '@/components/PropertyFeedCard';
import { Loading } from '@/components/Loading';
import { usePullRefresh } from '@/lib/use-refresh';
import { colors } from '@/theme/tokens';
import type { ExperienceListing } from '@/types/listing';

const { height } = Dimensions.get('window');
const QUICK_SKIP_MS = 2500;
const END = { __end: true } as const;
type Row = ExperienceListing | typeof END;

/** Home — instant, recommender-ranked discovery feed with first-run onboarding. */
export default function FeedScreen() {
  const { listings, loading } = useExperience();
  const { saved } = useSaved();
  const { rank, track, seedVersion } = useSignals();
  const { refreshing, onRefresh } = usePullRefresh();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Row>>(null);

  const [ranked, setRanked] = useState<ExperienceListing[]>([]);
  const [activeRefStr, setActiveRefStr] = useState<string | null>(null);
  const dwellRef = useRef<{ listing: ExperienceListing; since: number } | null>(null);

  useEffect(() => {
    if (listings.length) setRanked(rank(listings));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings, seedVersion]);

  // Long look = positive signal; quick flick = a skip (rejection engine).
  const flushDwell = useCallback((nextRef: string | null) => {
    const prev = dwellRef.current;
    if (prev && prev.listing.reference !== nextRef) {
      const ms = Date.now() - prev.since;
      if (ms < QUICK_SKIP_MS) track('skip', prev.listing);
      else track('dwell', prev.listing, ms);
    }
  }, [track]);
  const flushRef = useRef(flushDwell);
  useEffect(() => { flushRef.current = flushDwell; }, [flushDwell]);
  useEffect(() => () => flushRef.current(null), []);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0]?.item as Row | undefined;
    if (!first || '__end' in first) return;
    flushRef.current(first.reference);
    dwellRef.current = { listing: first, since: Date.now() };
    setActiveRefStr(first.reference);
  }).current;

  const goNext = useCallback((index: number) => {
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  }, []);

  const restart = useCallback(() => {
    setRanked(rank(listings));
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings]);

  const data: Row[] = useMemo(() => [...ranked, END], [ranked]);

  if (!listings.length && loading) return <Loading />;

  return (
    <View className="flex-1 bg-ink">
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(item, i) => ('__end' in item ? 'end' : item.reference) + i}
        renderItem={({ item, index }) =>
          '__end' in item ? (
            <EndCap onReview={() => router.push('/saved')} onRestart={restart} tabBarSpace={insets.bottom + 96} />
          ) : (
            <PropertyFeedCard
              listing={item}
              active={item.reference === activeRefStr}
              tabBarSpace={insets.bottom + 96}
              topInset={insets.top}
              onPass={() => goNext(index)}
            />
          )
        }
        pagingEnabled
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        windowSize={3}
        maxToRenderPerBatch={2}
        initialNumToRender={2}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
        getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffffff" />}
      />

      {/* Header — wordmark + search (mirrors the web deck header) */}
      <View style={{ position: 'absolute', top: insets.top + 4, left: 20, right: 16 }} className="flex-row items-center justify-between">
        <Text className="text-xl font-bold text-white">iClose</Text>
        <View className="flex-row gap-2">
          <Pressable onPress={() => router.push('/search')} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-black/30">
            <Search size={20} color="#fff" />
          </Pressable>
          <Pressable onPress={() => router.push('/saved')} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-black/30">
            <Heart size={20} color="#fff" fill={saved.size ? '#ff4d6d' : 'transparent'} />
          </Pressable>
        </View>
      </View>

      {/* Swipe-up hint on the first card */}
      {ranked[0] && activeRefStr === ranked[0].reference ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 110 }} className="items-center">
          <View className="rounded-full bg-black/40 px-3.5 py-1.5"><Text className="text-xs font-medium text-white">Swipe up for the next home</Text></View>
        </View>
      ) : null}
    </View>
  );
}

function EndCap({ onReview, onRestart, tabBarSpace }: { onReview: () => void; onRestart: () => void; tabBarSpace: number }) {
  return (
    <View style={{ height, paddingBottom: tabBarSpace }} className="items-center justify-center gap-3 bg-paper px-8">
      <Text className="text-[22px] font-semibold text-ink">That's everything for now</Text>
      <Text className="max-w-xs text-center text-sm text-graphite">Your feed reorders as you save, skip and explore. Come back for fresh matches.</Text>
      <Pressable onPress={onReview} className="mt-2 rounded-full bg-ink px-6 py-3"><Text className="text-[15px] font-medium text-white">Review saved</Text></Pressable>
      <Pressable onPress={onRestart}><Text className="text-sm font-medium" style={{ color: colors.accent }}>Start over</Text></Pressable>
    </View>
  );
}
