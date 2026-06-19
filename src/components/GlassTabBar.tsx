import { View, Pressable, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Flame, Search, Map, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '@/theme/tokens';

const ICONS: Record<string, typeof Home> = {
  index: Home, trending: Flame, search: Search, map: Map, profile: User,
};
const LABELS: Record<string, string> = {
  index: 'Home', trending: 'Trending', search: 'Search', map: 'Map', profile: 'Profile',
};

/** Floating frosted-glass pill tab bar — mirrors the web GlassTabBar. */
export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom, 14), alignItems: 'center' }}
    >
      <BlurView intensity={40} tint="light" style={{ borderRadius: 999, overflow: 'hidden' }}>
        <View className="flex-row items-center gap-1 rounded-full border border-white/40 bg-white/70 p-1.5">
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
                className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-2.5 ${focused ? 'bg-ink' : ''}`}
              >
                <Icon size={20} color={focused ? '#ffffff' : colors.graphite} />
                {focused ? (
                  <Text className="text-sm font-semibold text-white">{LABELS[route.name]}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}
