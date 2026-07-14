import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LayoutDashboard, ClipboardList, Users, SlidersHorizontal, User } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

/**
 * Persistent Liquid-Glass tab bar for the admin console — same material and
 * geometry as the user-side GlassTabBar. Renders the 5 main sections; detail and
 * sub-screens (managers, faqs, settings, emails, audit, [id]) live in the parent
 * admin Stack, pushed on top with their own back-stack.
 * Layout: Dashboard · Inquiries · Users · Manage · Profile.
 */
export function AdminTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;

  const go = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) navigation.navigate(name);
  };

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: insets.bottom + 8, paddingHorizontal: 14 }} pointerEvents="box-none">
      <BlurView intensity={40} tint="dark" style={{ borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
        <View className="flex-row items-center justify-between px-2 py-2" style={{ backgroundColor: 'rgba(20,20,22,0.6)' }}>
          <Item label="Dashboard" icon={LayoutDashboard} active={activeName === 'index'} onPress={() => go('index')} />
          <Item label="Inquiries" icon={ClipboardList} active={activeName === 'inquiries'} onPress={() => go('inquiries')} />
          <Item label="Users" icon={Users} active={activeName === 'users'} onPress={() => go('users')} />
          <Item label="Manage" icon={SlidersHorizontal} active={activeName === 'manage'} onPress={() => go('manage')} />
          <Item label="Profile" icon={User} active={activeName === 'profile'} onPress={() => go('profile')} />
        </View>
      </BlurView>
    </View>
  );
}

function Item({ label, icon: Icon, active, onPress }: { label: string; icon: typeof Users; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center gap-1 py-1.5">
      <Icon size={21} color={active ? colors.accent : colors.graphite} strokeWidth={active ? 2.5 : 2} fill={active ? colors.accent : 'transparent'} fillOpacity={active ? 0.15 : 0} />
      <Text style={{ color: active ? colors.accent : colors.graphite }} className="text-[10.5px] font-semibold">{label}</Text>
    </Pressable>
  );
}
