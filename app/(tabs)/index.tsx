import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Dimensions, Pressable, type ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { useExperience } from '@/store/experience';
import { useSaved } from '@/store/saved';
import { useSignals } from '@/store/signals';
import { PropertyFeedCard } from '@/components/PropertyFeedCard';
import { Loading } from '@/components/Loading';
import type { ExperienceListing } from '@/types/listing';

const { height } = Dimensions.get('window');

/** Home — the instant, full-screen, recommender-ranked discovery feed. */
export default function FeedScreen() {
  const { listings, loading } = useExperience();
  const { saved } = useSaved();
  const { rank, track, seedVersion } = useSignals();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ExperienceListing>>(null);

  const [ranked, setRanked] = useState<ExperienceListing[]>([]);
  const activeRef = useRef<{ listing: ExperienceListing; since: number } | null>(null);
  const [activeRefStr, setActiveRefStr] = useState<string | null>(null);

  // Rank once per data/seed change so cards don't reshuffle while scrolling.
  useEffect(() => {
    if (listings.length) setRanked(rank(listings));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings, seedVersion]);

  // Record dwell time on the card the user is leaving.
  const flushDwell = useCallback(() => {
    const a = activeRef.current;
    if (a) {
      const ms = Date.now() - a.since;
      if (ms > 1200) track('dwell', a.listing, ms);
    }
  }, [track]);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0]?.item as ExperienceListing | undefined;
    if (!first) return;
    flushDwellRef.current();
    activeRef.current = { listing: first, since: Date.now() };
    setActiveRefStr(first.reference);
  }).current;

  // Keep the latest flushDwell reachable from the stable onViewable callback.
  const flushDwellRef = useRef(flushDwell);
  useEffect(() => { flushDwellRef.current = flushDwell; }, [flushDwell]);
  useEffect(() => () => flushDwellRef.current(), []);

  const goNext = useCallback((index: number) => {
    if (index + 1 < ranked.length) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    }
  }, [ranked.length]);

  if (!listings.length && loading) return <Loading />;

  return (
    <View className="flex-1 bg-ink">
      <FlatList
        ref={listRef}
        data={ranked}
        keyExtractor={(l) => l.reference}
        renderItem={({ item, index }) => (
          <PropertyFeedCard
            listing={item}
            active={item.reference === activeRefStr}
            tabBarSpace={insets.bottom + 96}
            topInset={insets.top}
            onPass={() => goNext(index)}
          />
        )}
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
      />

      {/* Wordmark overlay */}
      <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 6, left: 20 }}>
        <Text className="text-lg font-bold text-white">iClose</Text>
      </View>

      {/* Saved shortcut */}
      <Pressable
        onPress={() => router.push('/saved')}
        style={{ position: 'absolute', top: insets.top + 2, right: 16 }}
        className="h-10 w-10 items-center justify-center rounded-full bg-black/30"
        hitSlop={8}
      >
        <Heart size={20} color="#fff" fill={saved.size ? '#ff4d6d' : 'transparent'} />
      </Pressable>
    </View>
  );
}
