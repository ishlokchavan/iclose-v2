import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, RefreshControl, Modal, Alert } from 'react-native';
import { useFocusEffect, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X, Check } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import {
  adminListUsers, adminUpdateUser, adminListManagers,
  type AdminUser, type ManagerRow,
} from '@/lib/admin';
import { ROLE_LABEL, type UserRole } from '@/lib/deals';
import { GlassBg } from '@/components/Glass';
import { Press, FadeIn } from '@/components/Press';
import { colors } from '@/theme/tokens';
import { AdminHeader, Loading, Empty, Chip, PrimaryButton } from './_ui';

const ROLES: UserRole[] = ['buyer', 'seller', 'broker'];

export default function AdminUsers() {
  const insets = useSafeAreaInsets();
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [managers, setManagers] = useState<ManagerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [role, setRole] = useState<UserRole>('buyer');
  const [managerId, setManagerId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [u, m] = await Promise.all([adminListUsers(), adminListManagers()]);
    setUsers(u);
    setManagers(m);
  }, []);
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => [u.full_name, u.email, u.phone, u.ref_code].some((v) => v?.toLowerCase().includes(q)));
  }, [users, query]);

  function open(u: AdminUser) {
    setEditing(u);
    setRole(u.role);
    setManagerId(u.account_manager_id);
  }

  async function save() {
    if (!editing) return;
    setBusy(true);
    try {
      await adminUpdateUser(editing.id, { role, account_manager_id: managerId });
      setEditing(null);
      await load();
    } catch (e) {
      Alert.alert('Could not save', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!authLoading && !isAdmin) return <Redirect href="/" />;

  const managerName = (id: string | null) => managers.find((m) => m.id === id)?.name ?? null;

  return (
    <View className="flex-1">
      <GlassBg />
      <AdminHeader title="Users" insetTop={insets.top} />

      <View className="px-4 pb-2">
        <View className="flex-row items-center gap-2 rounded-2xl border border-hairline bg-surface2 px-3.5">
          <Search size={17} color={colors.graphiteLight} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search name, email, ref…"
            placeholderTextColor={colors.graphiteLight}
            className="flex-1 py-3 text-[15px] text-ink"
          />
        </View>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          {shown.length === 0 ? (
            <Empty text="No users found." />
          ) : (
            <View className="gap-3">
              {shown.map((u, i) => (
                <FadeIn key={u.id} delay={Math.min(i, 8) * 30}>
                  <Press onPress={() => open(u)} className="flex-row items-center gap-3 rounded-apple border border-hairline bg-surface p-4">
                    <View className="h-11 w-11 items-center justify-center rounded-full bg-accent">
                      <Text className="text-[16px] font-semibold" style={{ color: colors.onAccent }}>
                        {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-semibold text-ink" numberOfLines={1}>{u.full_name || 'Unnamed'}</Text>
                      <Text className="text-[12.5px] text-graphite" numberOfLines={1}>{u.email || 'No email'}</Text>
                      <Text className="mt-0.5 text-[11.5px] text-graphite-light" numberOfLines={1}>
                        {ROLE_LABEL[u.role]} · {u.ref_code}{managerName(u.account_manager_id) ? ` · AM: ${managerName(u.account_manager_id)}` : ''}
                      </Text>
                    </View>
                  </Press>
                </FadeIn>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Editor sheet */}
      <Modal visible={!!editing} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
        <View className="flex-1 justify-end bg-black/60">
          <View style={{ paddingBottom: insets.bottom + 20 }} className="rounded-t-[24px] border-t border-hairline bg-paper px-5 pt-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[18px] font-semibold text-ink">Edit user</Text>
              <Press onPress={() => setEditing(null)} className="h-9 w-9 items-center justify-center rounded-full bg-surface2">
                <X size={19} color={colors.ink} />
              </Press>
            </View>
            <Text className="mb-3 text-[13.5px] text-graphite" numberOfLines={1}>
              {editing?.full_name || editing?.email || 'User'}
            </Text>

            <Text className="mb-2 text-[13px] font-medium text-graphite">Role</Text>
            <View className="mb-4 flex-row gap-2">
              {ROLES.map((r) => (
                <Chip key={r} label={ROLE_LABEL[r]} active={role === r} onPress={() => setRole(r)} />
              ))}
            </View>

            <Text className="mb-2 text-[13px] font-medium text-graphite">Account manager</Text>
            <ScrollView style={{ maxHeight: 260 }} className="mb-5">
              <View className="gap-2">
                <ManagerOption label="None" active={managerId === null} onPress={() => setManagerId(null)} />
                {managers.map((m) => (
                  <ManagerOption key={m.id} label={`${m.name} · ${m.title}`} active={managerId === m.id} onPress={() => setManagerId(m.id)} />
                ))}
              </View>
            </ScrollView>

            <PrimaryButton label="Save changes" onPress={save} busy={busy} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ManagerOption({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Press
      onPress={onPress}
      className={`flex-row items-center justify-between rounded-2xl border px-4 py-3 ${active ? 'border-accent bg-accent/10' : 'border-hairline bg-surface2'}`}
    >
      <Text className="flex-1 text-[14.5px] font-medium text-ink" numberOfLines={1}>{label}</Text>
      {active ? <Check size={18} color={colors.accent} /> : null}
    </Press>
  );
}
