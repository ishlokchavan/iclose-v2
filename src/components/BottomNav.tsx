import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Plus, User, ShieldCheck } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme/tokens';

type Tab = 'home' | 'account' | 'admin';

/** Floating glass bottom navigation. Items are chosen by priority + role:
 *  Home, a prominent New-inquiry action, Account, and Admin (admins only). */
export function BottomNav({ active }: { active: Tab }) {
  const insets = useSafeAreaInsets();
  const { isAdmin } = useAuth();

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: insets.bottom + 8, paddingHorizontal: 20 }} pointerEvents="box-none">
      <BlurView intensity={40} tint="light" style={{ borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}>
        <View className="flex-row items-center justify-around bg-white/55 px-2 py-2">
          <NavItem icon={Home} label="Home" active={active === 'home'} onPress={() => router.replace('/dashboard')} />
          {isAdmin ? <NavItem icon={ShieldCheck} label="Admin" active={active === 'admin'} onPress={() => router.replace('/admin')} /> : null}
          <Center onPress={() => router.push('/new-inquiry')} />
          <NavItem icon={User} label="Account" active={active === 'account'} onPress={() => router.replace('/account')} />
        </View>
      </BlurView>
    </View>
  );
}

function NavItem({ icon: Icon, label, active, onPress }: { icon: typeof Home; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="min-w-[64px] items-center gap-1 py-1.5">
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
