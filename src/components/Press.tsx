import { useEffect, useRef } from 'react';
import { Animated, Pressable, type PressableProps, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Micro-interaction primitives.
 * `Press` — a Pressable that springs down on touch with a light haptic tap.
 * `FadeIn` — mounts children with a soft fade + rise (optional stagger delay).
 * Both are drop-in: swap <Pressable> → <Press>, wrap rows in <FadeIn delay={i*40}>.
 */

interface PressProps extends PressableProps {
  scaleTo?: number;
  haptic?: boolean;
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export function Press({ scaleTo = 0.96, haptic = true, onPressIn, onPressOut, onPress, children, style, ...rest }: PressProps) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
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
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
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
