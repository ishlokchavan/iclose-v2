import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, ActivityIndicator } from 'react-native';

/** Branded launch screen — white to match the app icon / native splash, so the
 *  cold-start is one seamless white screen before the app loads. */
export function Splash() {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);

  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
      <View style={StyleSheet.absoluteFill} />
      <Animated.View style={{ opacity, transform: [{ scale }] }} className="items-center">
        <Text style={{ fontSize: 46, fontWeight: '800', letterSpacing: -1, color: '#111113' }}>
          iClose<Text style={{ color: '#7ed000' }}>.</Text>
        </Text>
        <Text className="mt-3 text-[15px] font-medium" style={{ color: '#6e6e73' }}>Never pay commission again.</Text>
      </Animated.View>
      <Animated.View style={{ opacity }} className="absolute bottom-20">
        <ActivityIndicator color="#111113" />
      </Animated.View>
    </View>
  );
}
