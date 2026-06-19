import { useRef } from 'react';
import { View, Text, FlatList, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExperience } from '@/store/experience';
import { PropertyFeedCard } from '@/components/PropertyFeedCard';
import type { ExperienceListing } from '@/types/listing';

const { height } = Dimensions.get('window');

/** Home — the instant, full-screen, snap-paging discovery feed. */
export default function FeedScreen() {
  const { listings } = useExperience();
  const insets = useSafeAreaInsets();
  const ref = useRef<FlatList<ExperienceListing>>(null);

  return (
    <View className="flex-1 bg-ink">
      <FlatList
        ref={ref}
        data={listings}
        keyExtractor={(l) => l.reference}
        renderItem={({ item }) => <PropertyFeedCard listing={item} tabBarSpace={insets.bottom + 96} />}
        pagingEnabled
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        windowSize={3}
        maxToRenderPerBatch={2}
        initialNumToRender={2}
        getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })}
      />

      {/* Wordmark overlay */}
      <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 6, left: 20 }}>
        <Text className="text-lg font-bold text-white">iClose</Text>
      </View>
    </View>
  );
}
