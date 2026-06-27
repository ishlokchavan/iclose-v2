import { useEffect } from 'react';
import { Heart } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, withDelay,
} from 'react-native-reanimated';

/**
 * Instagram-style heart pop. Re-fires whenever `trigger` changes (increment it
 * on each double-tap). Purely decorative — never blocks touches.
 */
export function LikeBurst({ trigger }: { trigger: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!trigger) return;
    opacity.value = 1;
    scale.value = 0;
    scale.value = withSequence(
      withSpring(1, { damping: 11, stiffness: 220 }),
      withDelay(250, withTiming(1.25, { duration: 200 })),
    );
    opacity.value = withDelay(450, withTiming(0, { duration: 220 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <Heart size={128} color="#fff" fill="#fff" style={{ shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12 }} />
    </Animated.View>
  );
}
