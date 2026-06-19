import { useEffect, useState } from 'react';
import { View, Pressable, Image as RNImage, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, Compass, Search, MapPin, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { supabase } from '@/lib/supabase';

const ICONS: Record<string, typeof House> = {
  index: House, trending: Compass, search: Search, map: MapPin,
};
// Icons that read well as a solid glyph when active (Instagram fills the active tab).
const FILLABLE: Record<string, boolean> = { index: true, trending: false, search: false, map: true };

const ICON = '#ffffff';
const BG = '#000000';
const HAIRLINE = '#262626';

/**
 * Instagram-style bottom tab bar: a solid full-width bar with a hairline top
 * border, evenly-spaced black icons (outline when inactive, filled/bold when
 * active), no labels, and the Profile tab as a circular avatar with a ring when
 * active. Tap to navigate.
 */
export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [initial, setInitial] = useState<string | null>(null);

  useEffect(() => {
    const apply = (u: { email?: string | null; user_metadata?: Record<string, unknown> } | undefined | null) => {
      const url = (u?.user_metadata?.avatar_url as string | undefined) ?? (u?.user_metadata?.picture as string | undefined) ?? null;
      setAvatar(url);
      setInitial(u?.email ? u.email[0].toUpperCase() : null);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session?.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => apply(s?.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  function go(routeName: string, key: string, focused: boolean) {
    Haptics.selectionAsync();
    const e = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
    if (!focused && !e.defaultPrevented) navigation.navigate(routeName);
  }

  return (
    <View
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        paddingBottom: insets.bottom,
        backgroundColor: BG,
        borderTopWidth: 0.5,
        borderTopColor: HAIRLINE,
      }}
    >
      <View style={{ flexDirection: 'row', height: 49, alignItems: 'center' }}>
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const isProfile = route.name === 'profile';
          const Icon = ICONS[route.name] ?? House;
          return (
            <Pressable
              key={route.key}
              onPress={() => go(route.name, route.key, focused)}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}
              hitSlop={6}
            >
              {isProfile ? (
                <View
                  style={{
                    height: 27, width: 27, borderRadius: 14, overflow: 'hidden',
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: '#262626',
                    borderWidth: focused ? 2 : 1,
                    borderColor: focused ? ICON : '#555555',
                  }}
                >
                  {avatar ? (
                    <RNImage source={{ uri: avatar }} style={{ height: '100%', width: '100%' }} />
                  ) : initial ? (
                    <Text style={{ fontSize: 12, fontWeight: '600', color: ICON }}>{initial}</Text>
                  ) : (
                    <User size={16} color={ICON} strokeWidth={2} />
                  )}
                </View>
              ) : (
                <Icon
                  size={27}
                  color={ICON}
                  strokeWidth={focused ? 2.4 : 1.8}
                  fill={focused && FILLABLE[route.name] ? ICON : 'transparent'}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
