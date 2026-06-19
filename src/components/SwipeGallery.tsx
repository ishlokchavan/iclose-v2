import { useEffect, useRef, useState } from 'react';
import { View, Pressable, FlatList, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play, Volume2, VolumeX } from 'lucide-react-native';

type Slide = { type: 'image' | 'video'; uri: string; poster: string };

const { width: SCREEN_W } = Dimensions.get('window');

/**
 * Horizontal photo/video gallery — mirrors the web SwipeGallery. Videos play
 * inline (muted, looping) when their slide is in view; tap to mute/unmute, and
 * double-tap anywhere to save (handled by the parent via onDoubleTap).
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

  function handleDoubleTap() {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      onDoubleTap?.();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
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
        renderItem={({ item, index: i }) =>
          item.type === 'video' ? (
            <VideoSlide uri={item.uri} poster={item.poster} width={width} height={height} contentFit={contentFit} active={i === index} onDoubleTap={handleDoubleTap} />
          ) : (
            <Pressable onPress={handleDoubleTap} style={{ width, height }}>
              <Image source={{ uri: item.poster }} style={{ width, height }} contentFit={contentFit} transition={200} />
            </Pressable>
          )
        }
      />

      {slides.length > 1 ? (
        <View pointerEvents="none" className="absolute left-0 right-0 flex-row items-center justify-center gap-1.5" style={{ top: 14 }}>
          {slides.map((_, i) =>
            indicator === 'bars' ? (
              <View key={i} style={{ height: 3, width: 22, borderRadius: 2 }} className={i === index ? 'bg-white' : 'bg-white/40'} />
            ) : (
              <View key={i} style={{ height: 6, width: 6, borderRadius: 3 }} className={i === index ? 'bg-white' : 'bg-white/40'} />
            ),
          )}
        </View>
      ) : null}
    </View>
  );
}

function VideoSlide({
  uri, poster, width, height, contentFit, active, onDoubleTap,
}: {
  uri: string; poster: string; width: number; height: number;
  contentFit: 'cover' | 'contain'; active: boolean; onDoubleTap: () => void;
}) {
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const lastTap = useRef(0);
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // Play only while this slide is the one in view.
  useEffect(() => {
    if (active) player.play();
    else player.pause();
  }, [active, player]);

  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') setReady(true);
    });
    return () => sub.remove();
  }, [player]);

  function tap() {
    const now = Date.now();
    if (now - lastTap.current < 280) { onDoubleTap(); lastTap.current = 0; return; }
    lastTap.current = now;
    const next = !muted;
    setMuted(next);
    player.muted = next;
  }

  return (
    <Pressable onPress={tap} style={{ width, height }}>
      {/* Poster underlay until the video is ready, so there's never a black flash */}
      {!ready ? (
        <Image source={{ uri: poster }} style={{ position: 'absolute', width, height }} contentFit={contentFit} />
      ) : null}
      <VideoView player={player} style={{ width, height }} contentFit={contentFit} nativeControls={false} />
      {!ready ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} className="items-center justify-center">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-black/45"><Play size={28} color="#fff" fill="#fff" /></View>
        </View>
      ) : (
        <View pointerEvents="none" className="absolute bottom-4 right-4 h-9 w-9 items-center justify-center rounded-full bg-black/45">
          {muted ? <VolumeX size={18} color="#fff" /> : <Volume2 size={18} color="#fff" />}
        </View>
      )}
    </Pressable>
  );
}
