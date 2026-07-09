import { useEffect, useRef } from 'react';
import { Animated, Pressable, type PressableProps, type ViewStyle } from 'react-native';
import { cssInterop } from 'nativewind';
import * as Haptics from 'expo-haptics';

/**
 * Micro-interaction primitives.
 * `Press` — a Pressable that springs down on touch with a light haptic tap.
 * `FadeIn` — mounts children with a soft fade + rise (optional stagger delay).
 * Both are drop-in: swap <Pressable> → <Press>, wrap rows in <FadeIn delay={i*40}>.
 */

// One animated pressable, no wrapper view: the caller's className (flex-1, gap,
// self-*, …) applies to the actual touchable, so row/grid layouts stay intact.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
cssInterop(AnimatedPressable, { className: 'style' });

interface PressProps extends PressableProps {
  scaleTo?: number;
  haptic?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: ViewStyle | ViewStyle[];
}

export function Press({ scaleTo = 0.96, haptic = true, onPressIn, onPressOut, onPress, children, className, style, ...rest }: PressProps) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <AnimatedPressable
      className={className}
      style={[style as ViewStyle, { transform: [{ scale }] }]}
      onPressIn={(e) => {
        Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}

export function FadeIn({ children, delay = 0, distance = 8, duration = 340, style }: { children: React.ReactNode; delay?: number; distance?: number; duration?: number; style?: ViewStyle | ViewStyle[] }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration, delay, useNativeDriver: true }).start();
  }, [t, duration, delay]);
  return (
    <Animated.View
      style={[
        { opacity: t, transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
