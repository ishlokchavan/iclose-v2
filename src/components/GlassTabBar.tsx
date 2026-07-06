import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Home, ClipboardList, User, Plus } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

/**
 * Persistent Liquid-Glass tab bar. Because it's a real Tabs navigator bar, the
 * bar itself never re-mounts — only the screen content swaps when you switch.
 * Layout: Home · Inquiries · [＋ New] · Account.
 */
export function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;

  const go = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) navigation.navigate(name);
  };

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: insets.bottom + 8, paddingHorizontal: 20 }} pointerEvents="box-none">
      <BlurView intensity={40} tint="light" style={{ borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
        <View className="flex-row items-center justify-around bg-white/55 px-2 py-2">
          <Item label="Home" icon={Home} active={activeName === 'home'} onPress={() => go('home')} />
          <Item label="Inquiries" icon={ClipboardList} active={activeName === 'inquiries'} onPress={() => go('inquiries')} />
          <Center onPress={() => router.push('/new-inquiry')} />
          <Item label="Account" icon={User} active={activeName === 'account'} onPress={() => go('account')} />
        </View>
      </BlurView>
    </View>
  );
}

function Item({ label, icon: Icon, active, onPress }: { label: string; icon: typeof Home; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="min-w-[62px] items-center gap-1 py-1.5">
      <Icon size={22} color={active ? colors.accent : colors.graphite} strokeWidth={active ? 2.5 : 2} fill={active ? colors.accent : 'transparent'} fillOpacity={active ? 0.12 : 0} />
      <Text style={{ color: active ? colors.accent : colors.graphite }} className="text-[11px] font-semibold">{label}</Text>
    </Pressable>
  );
}

function Center({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="items-center gap-1 py-1.5">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-accent" style={{ shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}>
        <Plus size={26} color="#fff" strokeWidth={2.5} />
      </View>
      <Text style={{ color: colors.accent }} className="text-[11px] font-semibold">New</Text>
    </Pressable>
  );
}
