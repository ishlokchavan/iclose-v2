import { useEffect, useState } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Flame, Search, Map, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '@/theme/tokens';

/**
 * Optional iOS 26 Liquid Glass module. It ships only in a dev/standalone build
 * on iOS 26+, so we load it defensively — in Expo Go or on Android/older iOS the
 * require/availability check fails and we fall back to a frosted BlurView pill.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let GlassViewComp: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let GlassContainerComp: any = null;
let liquid = false;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const g = require('expo-glass-effect');
  if (g?.isLiquidGlassAvailable?.()) {
    GlassViewComp = g.GlassView;
    GlassContainerComp = g.GlassContainer;
    liquid = Boolean(GlassViewComp && GlassContainerComp);
  }
} catch {
  liquid = false;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnimatedGlass: any = GlassViewComp ? Animated.createAnimatedComponent(GlassViewComp) : null;

const ICONS: Record<string, typeof Home> = {
  index: Home, trending: Flame, search: Search, map: Map, profile: User,
};

const ITEM = 60;
const CAP_W = 48;
const CAP_H = 44;
const PAD = 6;
const BAR_H = 56;
const SPRING = { damping: 18, stiffness: 220, mass: 0.6 };

/**
 * Apple-style tab bar. Renders the genuine iOS 26 Liquid Glass material when
 * available, otherwise a frosted BlurView pill. The selection capsule springs
 * between tabs, and you can press-and-drag across the bar to select (haptic on
 * each change); tapping works too.
 */
export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const count = state.routes.length;
  const posFor = (i: number) => PAD + i * ITEM + (ITEM - CAP_W) / 2;

  const tx = useSharedValue(posFor(state.index));
  const dragIdx = useSharedValue(state.index);
  const [preview, setPreview] = useState(state.index);

  useEffect(() => {
    tx.value = withSpring(posFor(state.index), SPRING);
    dragIdx.value = state.index;
    setPreview(state.index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index]);

  function navigateTo(i: number) {
    const route = state.routes[i];
    const focused = state.index === i;
    const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
  }
  const buzz = () => Haptics.selectionAsync();

  const pan = Gesture.Pan()
    .minDistance(8)
    .onBegin((e) => {
      'worklet';
      const i = Math.min(count - 1, Math.max(0, Math.floor((e.x - PAD) / ITEM)));
      tx.value = withSpring(PAD + i * ITEM + (ITEM - CAP_W) / 2, SPRING);
      if (i !== dragIdx.value) { dragIdx.value = i; runOnJS(buzz)(); runOnJS(setPreview)(i); }
    })
    .onUpdate((e) => {
      'worklet';
      const i = Math.min(count - 1, Math.max(0, Math.floor((e.x - PAD) / ITEM)));
      if (i !== dragIdx.value) {
        dragIdx.value = i;
        tx.value = withSpring(PAD + i * ITEM + (ITEM - CAP_W) / 2, SPRING);
        runOnJS(buzz)();
        runOnJS(setPreview)(i);
      }
    })
    .onEnd((e) => {
      'worklet';
      const i = Math.min(count - 1, Math.max(0, Math.floor((e.x - PAD) / ITEM)));
      runOnJS(navigateTo)(i);
    });

  const tap = Gesture.Tap().onEnd((e) => {
    'worklet';
    const i = Math.min(count - 1, Math.max(0, Math.floor((e.x - PAD) / ITEM)));
    tx.value = withSpring(PAD + i * ITEM + (ITEM - CAP_W) / 2, SPRING);
    if (i !== dragIdx.value) { dragIdx.value = i; runOnJS(setPreview)(i); }
    runOnJS(buzz)();
    runOnJS(navigateTo)(i);
  });

  const gesture = Gesture.Race(pan, tap);

  const capStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));
  const barWidth = count * ITEM + PAD * 2;

  const items = (
    <GestureDetector gesture={gesture}>
      <View style={{ flexDirection: 'row', height: BAR_H, paddingHorizontal: PAD }}>
        {state.routes.map((route, i) => {
          const Icon = ICONS[route.name] ?? Home;
          const active = preview === i;
          return (
            <View key={route.key} style={{ width: ITEM, alignItems: 'center', justifyContent: 'center' }}>
              <Icon
                size={24}
                color={active ? colors.ink : colors.graphiteDark}
                strokeWidth={active ? 2.5 : 1.9}
                fill={active && route.name === 'index' ? colors.ink : 'transparent'}
              />
            </View>
          );
        })}
      </View>
    </GestureDetector>
  );

  const capsule = liquid && AnimatedGlass ? (
    <AnimatedGlass glassEffectStyle="clear" tintColor="rgba(255,255,255,0.45)" style={[styles.capsule, capStyle]} />
  ) : (
    <Animated.View style={[styles.capsule, styles.capsuleFallback, capStyle]} />
  );

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom, 14), alignItems: 'center' }}
    >
      <View style={[styles.shadow, { width: barWidth, height: BAR_H, borderRadius: BAR_H / 2 }]}>
        {liquid && GlassViewComp && GlassContainerComp ? (
          <GlassContainerComp spacing={22} style={[styles.fill, { borderRadius: BAR_H / 2 }]}>
            <GlassViewComp glassEffectStyle="regular" style={[styles.fill, { borderRadius: BAR_H / 2 }]} />
            {capsule}
            {items}
          </GlassContainerComp>
        ) : (
          <BlurView
            intensity={Platform.OS === 'android' ? 90 : 70}
            tint="systemChromeMaterialLight"
            style={[styles.fill, styles.glassBorder, { borderRadius: BAR_H / 2, overflow: 'hidden' }]}
          >
            {capsule}
            {items}
          </BlurView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject },
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  glassBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  capsule: {
    position: 'absolute',
    top: (BAR_H - CAP_H) / 2,
    left: 0,
    width: CAP_W,
    height: CAP_H,
    borderRadius: CAP_H / 2,
  },
  capsuleFallback: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
});
