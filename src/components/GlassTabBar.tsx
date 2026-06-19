import { View, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Flame, Search, Map, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '@/theme/tokens';

const ICONS: Record<string, typeof Home> = {
  index: Home, trending: Flame, search: Search, map: Map, profile: User,
};

/**
 * Floating Apple-style liquid-glass tab bar — a frosted, translucent pill with
 * a thin highlight border and soft shadow. Icons only; the active tab is a
 * filled ink circle (Home fills when active), mirroring the web GlassTabBar.
 */
export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom, 14), alignItems: 'center' }}
    >
      <View
        style={{
          borderRadius: 999,
          // Soft floating shadow — the "lift" of Apple's glass bar.
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
          elevation: 14,
        }}
      >
        <BlurView
          intensity={Platform.OS === 'android' ? 90 : 70}
          tint="systemChromeMaterialLight"
          style={{ borderRadius: 999, overflow: 'hidden' }}
        >
          <View
            className="flex-row items-center gap-1 p-1.5"
            style={{
              borderRadius: 999,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.55)',
              backgroundColor: 'rgba(255,255,255,0.35)',
            }}
          >
            {state.routes.map((route, i) => {
              const focused = state.index === i;
              const Icon = ICONS[route.name] ?? Home;
              return (
                <Pressable
                  key={route.key}
                  onPress={() => {
                    Haptics.selectionAsync();
                    const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                    if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
                  }}
                  hitSlop={6}
                  style={{
                    height: 48,
                    width: 48,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: focused ? colors.ink : 'transparent',
                    shadowColor: focused ? '#000' : 'transparent',
                    shadowOpacity: focused ? 0.25 : 0,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                  }}
                >
                  <Icon
                    size={23}
                    color={focused ? '#ffffff' : colors.graphiteDark}
                    strokeWidth={focused ? 2.4 : 1.9}
                    fill={focused && route.name === 'index' ? '#ffffff' : 'transparent'}
                  />
                </Pressable>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}
