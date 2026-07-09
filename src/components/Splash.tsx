import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/** Branded launch screen — black with a soft lime glow, matching the app icon
 *  and dark theme, so the cold-start is one seamless screen into the app. */
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
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#000000' }}>
      <LinearGradient colors={['rgba(158,255,0,0.10)', 'rgba(158,255,0,0)']} start={{ x: 0.25, y: 0.2 }} end={{ x: 0.9, y: 0.7 }} style={StyleSheet.absoluteFill} />
      <Animated.View style={{ opacity, transform: [{ scale }] }} className="items-center">
        <Text style={{ fontSize: 46, fontWeight: '800', letterSpacing: -1, color: '#f7f7f9' }}>
          iClose<Text style={{ color: '#9eff00' }}>.</Text>
        </Text>
        <Text className="mt-3 text-[15px] font-medium" style={{ color: '#8a8a8f' }}>Never pay commission again.</Text>
      </Animated.View>
      <Animated.View style={{ opacity }} className="absolute bottom-20">
        <ActivityIndicator color="#9eff00" />
      </Animated.View>
    </View>
  );
}
