import { useRef, useState } from 'react';
import { View, Pressable, FlatList, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { Play } from 'lucide-react-native';

type Slide = { type: 'image' | 'video'; uri: string; poster: string };

const { width: SCREEN_W } = Dimensions.get('window');

/**
 * Horizontal photo/video gallery — mirrors the web SwipeGallery. Videos play
 * before photos; tapping a video opens it in the system player. Double-tap
 * anywhere to save (handled by the parent via onDoubleTap).
 */
export function SwipeGallery({
  images,
  videos,
  width = SCREEN_W,
  height,
  indicator = 'bars',
  onDoubleTap,
  contentFit = 'cover',
}: {
  images: string[];
  videos?: string[];
  width?: number;
  height: number;
  indicator?: 'bars' | 'dots';
  onDoubleTap?: () => void;
  contentFit?: 'cover' | 'contain';
}) {
  const poster = images[0];
  const slides: Slide[] = [
    ...(videos ?? []).map((uri) => ({ type: 'video' as const, uri, poster })),
    ...images.map((uri) => ({ type: 'image' as const, uri, poster: uri })),
  ];
  const [index, setIndex] = useState(0);
  const lastTap = useRef(0);

  function handleTap(slide: Slide) {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      onDoubleTap?.();
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
    if (slide.type === 'video') WebBrowser.openBrowserAsync(slide.uri).catch(() => {});
  }

  return (
    <View style={{ width, height }}>
      <FlatList
        data={slides}
        keyExtractor={(s, i) => `${s.type}-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <Pressable onPress={() => handleTap(item)} style={{ width, height }}>
            <Image source={{ uri: item.poster }} style={{ width, height }} contentFit={contentFit} transition={200} />
            {item.type === 'video' ? (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <View className="h-16 w-16 items-center justify-center rounded-full bg-black/45">
                  <Play size={28} color="#fff" fill="#fff" />
                </View>
              </View>
            ) : null}
          </Pressable>
        )}
      />

      {slides.length > 1 ? (
        <View
          pointerEvents="none"
          className="absolute left-0 right-0 flex-row items-center justify-center gap-1.5"
          style={{ top: 14 }}
        >
          {slides.map((_, i) =>
            indicator === 'bars' ? (
              <View
                key={i}
                style={{ height: 3, width: 22, borderRadius: 2 }}
                className={i === index ? 'bg-white' : 'bg-white/40'}
              />
            ) : (
              <View
                key={i}
                style={{ height: 6, width: 6, borderRadius: 3 }}
                className={i === index ? 'bg-white' : 'bg-white/40'}
              />
            ),
          )}
        </View>
      ) : null}
    </View>
  );
}
