import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, FlatList, Dimensions, Modal } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, X } from 'lucide-react-native';
import { useExperience } from '@/store/experience';
import { fetchCarouselImages } from '@/lib/listings';

const { width: SCREEN_W } = Dimensions.get('window');
const PAD = 12;
const HALF = (SCREEN_W - PAD * 3) / 2;

/** Full property gallery — grid of all photos, tap any to view fullscreen. */
export default function GalleryScreen() {
  const { reference } = useLocalSearchParams<{ reference: string }>();
  const insets = useSafeAreaInsets();
  const { byRef } = useExperience();
  const listing = byRef(String(reference));
  const [extra, setExtra] = useState<string[]>([]);
  const [viewer, setViewer] = useState<number | null>(null);

  useEffect(() => {
    if (!listing?.images?.length && reference) {
      fetchCarouselImages(String(reference)).then((m) => setExtra(m[String(reference)] ?? []));
    }
  }, [listing, reference]);

  const images = listing?.images?.length ? listing.images : extra;

  return (
    <View className="flex-1 bg-ink">
      {/* Header */}
      <View style={{ paddingTop: insets.top + 6 }} className="flex-row items-center justify-center px-4 pb-3">
        <Pressable onPress={() => router.back()} hitSlop={10} className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-white/10" style={{ top: insets.top + 4 }}>
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <Text className="text-[17px] font-semibold text-white">Gallery</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: PAD, paddingBottom: insets.bottom + 24, gap: PAD }}>
        <View className="flex-row flex-wrap" style={{ gap: PAD }}>
          {images.map((uri, i) => {
            const full = i === 0; // hero image spans the row
            return (
              <Pressable key={`${uri}-${i}`} onPress={() => setViewer(i)} style={{ width: full ? SCREEN_W - PAD * 2 : HALF }}>
                <Image source={{ uri }} style={{ width: '100%', aspectRatio: full ? 1.5 : 1.1, borderRadius: 16 }} contentFit="cover" transition={150} />
              </Pressable>
            );
          })}
        </View>
        {!images.length ? <Text className="py-20 text-center text-white/60">No photos to show.</Text> : null}
      </ScrollView>

      {/* Fullscreen viewer */}
      <Modal visible={viewer !== null} transparent animationType="fade" onRequestClose={() => setViewer(null)} statusBarTranslucent>
        <View className="flex-1 bg-black">
          <FlatList
            data={images}
            keyExtractor={(u, i) => `${u}-${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={viewer ?? 0}
            getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_W }} className="items-center justify-center">
                <Image source={{ uri: item }} style={{ width: SCREEN_W, height: '100%' }} contentFit="contain" />
              </View>
            )}
          />
          <Pressable onPress={() => setViewer(null)} style={{ top: insets.top + 8 }} className="absolute right-4 h-10 w-10 items-center justify-center rounded-full bg-white/15">
            <X size={22} color="#fff" />
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
