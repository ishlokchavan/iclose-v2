import { useEffect, useRef, useState } from 'react';
import { View, Pressable, FlatList, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { Play, Volume2, VolumeX } from 'lucide-react-native';

type Slide = { type: 'image' | 'video'; uri: string; poster: string };

const { width: SCREEN_W } = Dimensions.get('window');

/**
 * Optional inline-video module (expo-video). Loaded defensively because it isn't
 * present in some runtimes (e.g. Expo Go); when missing, video slides show the
 * poster and open the tour in the system browser on tap.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let VideoMod: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  VideoMod = require('expo-video');
} catch {
  VideoMod = null;
}
const HAS_VIDEO = Boolean(VideoMod?.useVideoPlayer && VideoMod?.VideoView);

/** Horizontal photo/video gallery — mirrors the web SwipeGallery. */
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

  function doubleTap() {
    const now = Date.now();
    if (now - lastTap.current < 280) { onDoubleTap?.(); lastTap.current = 0; }
    else lastTap.current = now;
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
          item.type === 'video' && HAS_VIDEO ? (
            <VideoSlide uri={item.uri} poster={item.poster} width={width} height={height} contentFit={contentFit} active={i === index} onDoubleTap={doubleTap} />
          ) : item.type === 'video' ? (
            <PosterVideoSlide uri={item.uri} poster={item.poster} width={width} height={height} contentFit={contentFit} onDoubleTap={doubleTap} />
          ) : (
            <Pressable onPress={doubleTap} style={{ width, height }}>
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

/** Inline player (expo-video present). Muted + looping while in view; tap to mute/unmute. */
function VideoSlide({
  uri, poster, width, height, contentFit, active, onDoubleTap,
}: {
  uri: string; poster: string; width: number; height: number;
  contentFit: 'cover' | 'contain'; active: boolean; onDoubleTap: () => void;
}) {
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const lastTap = useRef(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const player = VideoMod.useVideoPlayer(uri, (p: any) => { p.loop = true; p.muted = true; });
  const VideoView = VideoMod.VideoView;

  useEffect(() => { if (active) player.play(); else player.pause(); }, [active, player]);
  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status }: { status: string }) => {
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
      {!ready ? <Image source={{ uri: poster }} style={{ position: 'absolute', width, height }} contentFit={contentFit} /> : null}
      <VideoView player={player} style={{ width, height }} contentFit={contentFit} nativeControls={false} />
      {!ready ? (
        <View pointerEvents="none" style={StyleAbsCenter}><PlayBadge /></View>
      ) : (
        <View pointerEvents="none" className="absolute bottom-4 right-4 h-9 w-9 items-center justify-center rounded-full bg-black/45">
          {muted ? <VolumeX size={18} color="#fff" /> : <Volume2 size={18} color="#fff" />}
        </View>
      )}
    </Pressable>
  );
}

/** Fallback (no expo-video): poster + play; opens the tour in the system browser. */
function PosterVideoSlide({
  uri, poster, width, height, contentFit, onDoubleTap,
}: {
  uri: string; poster: string; width: number; height: number;
  contentFit: 'cover' | 'contain'; onDoubleTap: () => void;
}) {
  const lastTap = useRef(0);
  function tap() {
    const now = Date.now();
    if (now - lastTap.current < 280) { onDoubleTap(); lastTap.current = 0; return; }
    lastTap.current = now;
    WebBrowser.openBrowserAsync(uri).catch(() => {});
  }
  return (
    <Pressable onPress={tap} style={{ width, height }}>
      <Image source={{ uri: poster }} style={{ width, height }} contentFit={contentFit} />
      <View pointerEvents="none" style={StyleAbsCenter}><PlayBadge /></View>
    </Pressable>
  );
}

const StyleAbsCenter = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' } as const;

function PlayBadge() {
  return (
    <View className="h-16 w-16 items-center justify-center rounded-full bg-black/45">
      <Play size={28} color="#fff" fill="#fff" />
    </View>
  );
}
