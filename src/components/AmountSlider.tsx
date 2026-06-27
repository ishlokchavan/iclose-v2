import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, runOnJS } from 'react-native-reanimated';
import { colors } from '@/theme/tokens';

const THUMB = 26;
const H = 40;

/**
 * Lightweight controlled slider built on the app's existing gesture + reanimated
 * stack (no new native dependency). Drag or tap the track to set a value;
 * snaps to `step` and clamps to [min, max].
 */
export function AmountSlider({
  min, max, step, value, onChange,
}: { min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  const [w, setW] = useState(0);
  const [dragging, setDragging] = useState(false);
  const usable = Math.max(1, w - THUMB);
  const x = useSharedValue(0);

  const ratio = max > min ? (value - min) / (max - min) : 0;
  useEffect(() => {
    if (!dragging) x.value = Math.min(usable, Math.max(0, ratio * usable));
  }, [ratio, usable, dragging, x]);

  function emit(nx: number) {
    const r = usable > 0 ? nx / usable : 0;
    let v = min + r * (max - min);
    v = Math.round(v / step) * step;
    onChange(Math.min(max, Math.max(min, v)));
  }

  const pan = Gesture.Pan().minDistance(0)
    .onBegin((e) => { runOnJS(setDragging)(true); const nx = Math.min(usable, Math.max(0, e.x - THUMB / 2)); x.value = nx; runOnJS(emit)(nx); })
    .onUpdate((e) => { const nx = Math.min(usable, Math.max(0, e.x - THUMB / 2)); x.value = nx; runOnJS(emit)(nx); })
    .onFinalize(() => { runOnJS(setDragging)(false); });

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const fillStyle = useAnimatedStyle(() => ({ width: x.value + THUMB / 2 }));

  return (
    <GestureDetector gesture={pan}>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: H, justifyContent: 'center' }}>
        <View style={{ position: 'absolute', left: 0, right: 0, top: (H - 6) / 2, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.08)' }} />
        <Animated.View style={[{ position: 'absolute', left: 0, top: (H - 6) / 2, height: 6, borderRadius: 3, backgroundColor: colors.accent }, fillStyle]} />
        <Animated.View
          style={[
            { position: 'absolute', left: 0, top: (H - THUMB) / 2, height: THUMB, width: THUMB, borderRadius: THUMB / 2, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.accent, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
            thumbStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
}
