import { useRef } from 'react';
import { View, Text, FlatList, Dimensions, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { useExperience } from '@/store/experience';
import { useSaved } from '@/store/saved';
import { PropertyFeedCard } from '@/components/PropertyFeedCard';
import { Loading } from '@/components/Loading';
import type { ExperienceListing } from '@/types/listing';

const { height } = Dimensions.get('window');

/** Home — the instant, full-screen, snap-paging discovery feed. */
export default function FeedScreen() {
  const { listings, loading } = useExperience();
  const { saved } = useSaved();
  const insets = useSafeAreaInsets();
  const ref = useRef<FlatList<ExperienceListing>>(null);

  if (!listings.length && loading) return <Loading />;

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
