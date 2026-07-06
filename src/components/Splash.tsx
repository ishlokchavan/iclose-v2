import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Wordmark } from './DealUI';
import { colors } from '@/theme/tokens';

/** Branded launch screen — shown while the session/profile loads, and as the
 *  backdrop the native splash fades into. */
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
    <View className="flex-1 items-center justify-center">
      <LinearGradient colors={['#e8f0ff', '#ffffff', '#f3edff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(0,113,227,0.10)', 'rgba(0,113,227,0)']} start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 0.6 }} style={StyleSheet.absoluteFill} />
      <Animated.View style={{ opacity, transform: [{ scale }] }} className="items-center">
        <Wordmark size={46} />
        <Text className="mt-3 text-[15px] font-medium text-graphite">Never pay commission again.</Text>
      </Animated.View>
      <Animated.View style={{ opacity }} className="absolute bottom-20">
        <ActivityIndicator color={colors.accent} />
      </Animated.View>
    </View>
  );
}
