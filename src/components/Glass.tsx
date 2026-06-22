import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

/**
 * Liquid-glass primitives. `Glass` renders Apple's iOS 26 Liquid Glass material
 * when available (expo-glass-effect), otherwise a frosted BlurView — used for
 * chrome (search fields, chips, action bars, panels). `GlassBg` is the soft
 * ambient gradient backdrop that gives the glass something to refract.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let GlassViewComp: any = null;
let liquid = false;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const g = require('expo-glass-effect');
  if (g?.isLiquidGlassAvailable?.()) {
    GlassViewComp = g.GlassView;
    liquid = Boolean(GlassViewComp);
  }
} catch {
  liquid = false;
}

export function Glass({
  children,
  style,
  rounded = 18,
  tint = 'light',
  intensity = 50,
  glassStyle = 'regular',
}: {
  children?: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style?: any;
  rounded?: number;
  tint?: 'light' | 'dark' | 'default';
  intensity?: number;
  glassStyle?: 'regular' | 'clear';
}) {
  if (liquid && GlassViewComp) {
    return (
      <GlassViewComp glassEffectStyle={glassStyle} style={[{ borderRadius: rounded, overflow: 'hidden' }, style]}>
        {children}
      </GlassViewComp>
    );
  }
  return (
    <BlurView
      intensity={Platform.OS === 'android' ? intensity + 30 : intensity}
      tint={tint === 'light' ? 'systemChromeMaterialLight' : tint === 'dark' ? 'systemChromeMaterialDark' : 'default'}
      style={[
        { borderRadius: rounded, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.45)' },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

/** Soft ambient backdrop for light screens — a subtle tinted gradient. */
export function GlassBg() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#eaf0ff', '#fbfbfd', '#f4edff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(0,113,227,0.10)', 'rgba(0,113,227,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(163,188,255,0)', 'rgba(163,188,255,0.16)']}
        start={{ x: 0.4, y: 0.6 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
