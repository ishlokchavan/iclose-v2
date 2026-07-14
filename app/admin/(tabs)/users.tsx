import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, RefreshControl, Modal, Alert, ActivityIndicator } from 'react-native';
import { router, useFocusEffect, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Search, X, Check, ShoppingBag, Briefcase, ChevronRight, Ban, Trash2, type LucideIcon } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import {
  adminListUsers, adminUpdateUser, adminGetUserDetail, adminListManagers,
  adminSetUserActive, adminDeleteUser,
  type AdminUser, type AdminUserDetail, type ManagerRow,
} from '@/lib/admin';
import { ROLE_LABEL, CHANNEL_LABEL, type UserRole } from '@/lib/deals';
import { signedUrl } from '@/lib/profile-uploads';
import { maskIban } from '@/lib/iban';
import { GlassBg } from '@/components/Glass';
import { StatusBadge } from '@/components/DealUI';
import { Press, FadeIn } from '@/components/Press';
import { FilterControl, DayHeader, SecureNote } from '@/components/ListKit';
import { inPeriod, groupByDay, sortByDate, type PeriodState, type SortDir } from '@/lib/dates';
import { formatAed, formatDate } from '@/lib/format';
import { colors } from '@/theme/tokens';
import { AdminHeader, Loading, Empty, Chip, PrimaryButton } from '../_ui';

/** Editable roles — sellers are legacy; admins only assign buyer/broker. */
const EDIT_ROLES: UserRole[] = ['buyer', 'broker'];

type RoleFilter = 'all' | 'buyer' | 'broker';
const ROLE_FILTERS: { key: RoleFilter; label: string; Icon?: LucideIcon }[] = [
  { key: 'all', label: 'All' },
  { key: 'buyer', label: 'Buyer', Icon: ShoppingBag },
  { key: 'broker', label: 'Broker', Icon: Briefcase },
];

export default function AdminUsers() {
  const insets = useSafeAreaInsets();
  const { isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [managers, setManagers] = useState<ManagerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [period, setPeriod] = useState<PeriodState>({ period: 'all' });
  const [sort, setSort] = useState<SortDir>('newest');

  // Detail sheet
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});
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
    const filtered = users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!inPeriod(u.created_at, period)) return false;
      if (!q) return true;
      return [u.full_name, u.email, u.phone, u.ref_code].some((v) => v?.toLowerCase().includes(q));
    });
    return sortByDate(filtered, (u) => u.created_at, sort);
  }, [users, query, roleFilter, period, sort]);

  const groups = useMemo(() => groupByDay(shown, (u) => u.created_at), [shown]);

  function open(u: AdminUser) {
    setSelected(u);
    setRole(u.role === 'seller' ? 'buyer' : u.role);
    setManagerId(u.account_manager_id);
    setDetail(null);
    setUrls({});
    setDetailLoading(true);
    adminGetUserDetail(u.id)
      .then(async (d) => {
        setDetail(d);
        const paths = [d.profile?.avatar_path, d.profile?.id_doc_path, ...d.documents.map((x) => x.path)]
          .filter((p): p is string => !!p);
        const entries = await Promise.all(paths.map(async (p) => [p, await signedUrl(p)] as const));
        const map: Record<string, string> = {};
        for (const [p, u2] of entries) if (u2) map[p] = u2;
        setUrls(map);
      })
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  }

  async function save() {
    if (!selected) return;
    setBusy(true);
    try {
      await adminUpdateUser(selected.id, { role, account_manager_id: managerId });
      setSelected(null);
      await load();
    } catch (e) {
      Alert.alert('Could not save', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function openDeal(dealId: string) {
    setSelected(null);
    router.push(`/admin/${dealId}`);
  }

  async function setActive(active: boolean) {
    if (!selected) return;
    setBusy(true);
    try {
      await adminSetUserActive(selected.id, active);
      setSelected(null);
      await load();
    } catch (e) {
      Alert.alert('Could not update', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function confirmDeactivate() {
    if (!selected) return;
    const active = selected.active;
    Alert.alert(
      active ? 'Deactivate user?' : 'Reactivate user?',
      active
        ? 'They will be blocked from signing in until you reactivate them. Their data is kept.'
        : 'They will be able to sign in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: active ? 'Deactivate' : 'Reactivate', style: active ? 'destructive' : 'default', onPress: () => setActive(!active) },
      ],
    );
  }

  function confirmDelete() {
    if (!selected) return;
    Alert.alert(
      'Delete user?',
      `Permanently delete ${selected.full_name || selected.email || 'this user'} and all their inquiries, documents and bank accounts. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!selected) return;
            setBusy(true);
            try {
              await adminDeleteUser(selected.id);
              setSelected(null);
              await load();
            } catch (e) {
              Alert.alert('Could not delete', (e as Error).message);
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  if (!authLoading && !isAdmin) return <Redirect href="/" />;

  const managerName = (id: string | null) => managers.find((m) => m.id === id)?.name ?? null;
  const profile = detail?.profile ?? null;
  let rowIndex = 0;

  return (
    <View className="flex-1">
      <GlassBg />
      <AdminHeader title="Users" insetTop={insets.top} />

      <View className="flex-row items-center gap-2 px-4 pb-2">
        <View className="flex-1 flex-row items-center gap-2 rounded-2xl border border-hairline bg-surface2 px-3.5">
          <Search size={17} color={colors.graphiteLight} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search name, email, ref…"
            placeholderTextColor={colors.graphiteLight}
            className="flex-1 py-3 text-[15px] text-ink"
          />
        </View>
        <FilterControl period={period} onPeriod={setPeriod} sort={sort} onSort={setSort} />
      </View>

      <View className="gap-2 px-4 pb-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row gap-2">
            {ROLE_FILTERS.map(({ key, label, Icon }) => {
              const active = roleFilter === key;
              return (
                <Press
                  key={key}
                  onPress={() => setRoleFilter(key)}
                  className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-2 ${active ? 'bg-accent' : 'border border-hairline bg-surface2'}`}
                >
                  {Icon ? <Icon size={13} color={active ? colors.onAccent : colors.graphite} /> : null}
                  <Text className="text-[13px] font-semibold" style={{ color: active ? colors.onAccent : colors.ink }}>{label}</Text>
                </Press>
              );
            })}
          </View>
          <Text className="text-[12.5px] text-graphite">{shown.length} {shown.length === 1 ? 'user' : 'users'}</Text>
        </View>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: insets.bottom + 110 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          {shown.length === 0 ? (
            <Empty text="No users found." />
          ) : (
            groups.map(([label, items]) => (
              <View key={label} className="mb-2">
                <DayHeader label={label} right={`${items.length}`} />
                <View className="gap-3 pb-1">
                  {items.map((u) => {
                    const i = rowIndex++;
                    return (
                      <FadeIn key={u.id} delay={Math.min(i, 8) * 30}>
                        <Press onPress={() => open(u)} className="flex-row items-center gap-3 rounded-apple border border-hairline bg-surface p-4">
                          <View className="h-11 w-11 items-center justify-center rounded-full bg-accent">
                            <Text className="text-[16px] font-semibold" style={{ color: colors.onAccent }}>
                              {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <View className="flex-row items-center gap-2">
                              <Text className="shrink text-[15px] font-semibold text-ink" numberOfLines={1}>{u.full_name || 'Unnamed'}</Text>
                              {!u.active ? (
                                <View className="rounded-full bg-[#ff6b6b]/15 px-2 py-0.5">
                                  <Text className="text-[10px] font-bold" style={{ color: '#ff6b6b' }}>Deactivated</Text>
                                </View>
                              ) : null}
                            </View>
                            <Text className="text-[12.5px] text-graphite" numberOfLines={1}>{u.email || 'No email'}</Text>
                            <Text className="mt-0.5 text-[11.5px] text-graphite-light" numberOfLines={1}>
                              {ROLE_LABEL[u.role]} · {u.ref_code}{managerName(u.account_manager_id) ? ` · AM: ${managerName(u.account_manager_id)}` : ''}
                            </Text>
                          </View>
                          <ChevronRight size={18} color={colors.graphiteLight} />
                        </Press>
                      </FadeIn>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Full user detail sheet */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View className="flex-1 justify-end bg-black/60">
          <View style={{ maxHeight: '90%', paddingBottom: insets.bottom + 16 }} className="rounded-t-[24px] border-t border-hairline bg-paper px-5 pt-5">
            <View className="mb-3 flex-row items-center gap-3">
              {profile?.avatar_path && urls[profile.avatar_path] ? (
                <Image source={{ uri: urls[profile.avatar_path] }} style={{ width: 48, height: 48, borderRadius: 24 }} contentFit="cover" />
              ) : (
                <View className="h-12 w-12 items-center justify-center rounded-full bg-accent">
                  <Text className="text-[17px] font-semibold" style={{ color: colors.onAccent }}>
                    {(selected?.full_name || selected?.email || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View className="flex-1">
                <Text className="text-[17px] font-semibold text-ink" numberOfLines={1}>{selected?.full_name || 'Unnamed'}</Text>
                <Text className="text-[12.5px] text-graphite" numberOfLines={1}>{selected?.email || 'No email'}</Text>
              </View>
              <Press onPress={() => setSelected(null)} className="h-9 w-9 items-center justify-center rounded-full bg-surface2">
                <X size={19} color={colors.ink} />
              </Press>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="shrink" keyboardShouldPersistTaps="handled">
              {detailLoading ? (
                <ActivityIndicator className="my-14" color={colors.accent} />
              ) : (
                <View className="gap-4 pb-4">
                  {/* Profile */}
                  <FadeIn delay={0}>
                    <View className="rounded-apple border border-hairline bg-surface p-4">
                      <Text className="mb-1 text-[13px] font-semibold uppercase tracking-wide text-graphite">Profile</Text>
                      <InfoRow label="Phone" value={profile?.phone || '—'} />
                      <InfoRow label="Preferred channel" value={profile?.preferred_channel ? CHANNEL_LABEL[profile.preferred_channel] : '—'} />
                      <InfoRow label="Ref code" value={profile?.ref_code ?? selected?.ref_code ?? '—'} />
                      <InfoRow label="Joined" value={formatDate(profile?.created_at ?? selected?.created_at)} />
                      <InfoRow label="Onboarded" value={(profile?.onboarded ?? selected?.onboarded) ? 'Yes' : 'No'} last />
                    </View>
                  </FadeIn>

                  {/* Verification */}
                  <FadeIn delay={40}>
                    <View className="rounded-apple border border-hairline bg-surface p-4">
                      <Text className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-graphite">Verification</Text>
                      {!profile?.id_doc_path && (detail?.documents.length ?? 0) === 0 ? (
                        <Text className="text-[13px] text-graphite">No documents uploaded.</Text>
                      ) : (
                        <View className="gap-3">
                          {profile?.id_doc_path ? (
                            <DocPreview kind={profile.id_doc_type || 'ID document'} uri={urls[profile.id_doc_path]} />
                          ) : null}
                          {detail?.documents.map((doc) => (
                            <DocPreview
                              key={doc.id}
                              kind={doc.kind}
                              name={doc.name}
                              uri={doc.mime?.startsWith('image') !== false ? urls[doc.path] : undefined}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  </FadeIn>

                  {/* Bank accounts */}
                  <FadeIn delay={80}>
                    <View className="rounded-apple border border-hairline bg-surface p-4">
                      <Text className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-graphite">Bank accounts</Text>
                      {(detail?.banks.length ?? 0) === 0 ? (
                        <Text className="text-[13px] text-graphite">No bank accounts on file.</Text>
                      ) : (
                        <View className="gap-2">
                          {detail?.banks.map((b) => (
                            <View key={b.id} className="rounded-2xl border border-hairline bg-surface2 px-4 py-3">
                              <View className="flex-row items-center justify-between gap-2">
                                <Text className="flex-1 text-[14px] font-semibold text-ink" numberOfLines={1}>{b.bank_name || 'Bank account'}</Text>
                                {b.is_primary ? (
                                  <View className="rounded-full bg-accent px-2 py-0.5">
                                    <Text className="text-[10.5px] font-bold" style={{ color: colors.onAccent }}>Primary</Text>
                                  </View>
                                ) : null}
                              </View>
                              {b.account_name ? <Text className="mt-0.5 text-[12px] text-graphite" numberOfLines={1}>{b.account_name}</Text> : null}
                              <Text className="mt-0.5 text-[13px] font-medium text-ink">{maskIban(b.iban)}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </FadeIn>

                  {/* Deals */}
                  <FadeIn delay={120}>
                    <View className="rounded-apple border border-hairline bg-surface p-4">
                      <View className="mb-2 flex-row items-end justify-between">
                        <Text className="text-[13px] font-semibold uppercase tracking-wide text-graphite">Deals</Text>
                        <Text className="text-[13px] font-bold text-ink">{detail?.deals.length ?? 0}</Text>
                      </View>
                      {(detail?.deals.length ?? 0) === 0 ? (
                        <Text className="text-[13px] text-graphite">No deals submitted.</Text>
                      ) : (
                        <View className="gap-2">
                          {detail?.deals.map((d) => (
                            <Press key={d.id} onPress={() => openDeal(d.id)} className="flex-row items-center gap-3 rounded-2xl border border-hairline bg-surface2 px-4 py-3">
                              <View className="flex-1">
                                <Text className="text-[13.5px] font-semibold text-ink" numberOfLines={1}>{d.title || d.project || d.area || 'Inquiry'}</Text>
                                <Text className="mt-0.5 text-[11.5px] text-graphite-light" numberOfLines={1}>
                                  {d.ref_code} · {formatDate(d.created_at)}{d.deal_value_aed != null ? ` · ${formatAed(d.deal_value_aed)}` : d.budget_aed != null ? ` · ${formatAed(d.budget_aed)}` : ''}
                                </Text>
                              </View>
                              <StatusBadge status={d.status} />
                              <ChevronRight size={16} color={colors.graphiteLight} />
                            </Press>
                          ))}
                        </View>
                      )}
                    </View>
                  </FadeIn>

                  {/* Role */}
                  <FadeIn delay={160}>
                    <View>
                      <Text className="mb-2 text-[13px] font-medium text-graphite">Role</Text>
                      <View className="flex-row gap-2">
                        {EDIT_ROLES.map((r) => (
                          <Chip key={r} label={ROLE_LABEL[r]} active={role === r} onPress={() => setRole(r)} />
                        ))}
                      </View>
                    </View>
                  </FadeIn>

                  {/* Account manager */}
                  <FadeIn delay={200}>
                    <View>
                      <Text className="mb-2 text-[13px] font-medium text-graphite">Account manager</Text>
                      <View className="gap-2">
                        <ManagerOption label="None" active={managerId === null} onPress={() => setManagerId(null)} />
                        {managers.map((m) => (
                          <ManagerOption key={m.id} label={`${m.name} · ${m.title}`} active={managerId === m.id} onPress={() => setManagerId(m.id)} />
                        ))}
                      </View>
                    </View>
                  </FadeIn>

                  {/* Danger zone — deactivate (bans sign-in) / delete */}
                  <FadeIn delay={240}>
                    <View className="mt-1">
                      <Text className="mb-2 text-[13px] font-medium text-graphite">Account status</Text>
                      <View className="gap-2">
                        <Press onPress={confirmDeactivate} disabled={busy} className="flex-row items-center justify-center gap-2 rounded-2xl border border-hairline bg-surface2 py-3.5">
                          {selected?.active ? <Ban size={17} color={colors.ink} /> : <Check size={17} color={colors.accent} />}
                          <Text className="text-[14.5px] font-semibold text-ink">{selected?.active ? 'Deactivate user' : 'Reactivate user'}</Text>
                        </Press>
                        <Press onPress={confirmDelete} disabled={busy} className="flex-row items-center justify-center gap-2 rounded-2xl border py-3.5" style={{ borderColor: 'rgba(255,107,107,0.3)', backgroundColor: 'rgba(255,107,107,0.1)' }}>
                          <Trash2 size={17} color="#ff6b6b" />
                          <Text className="text-[14.5px] font-semibold" style={{ color: '#ff6b6b' }}>Delete user</Text>
                        </Press>
                      </View>
                    </View>
                  </FadeIn>
                </View>
              )}
            </ScrollView>

            <View className="pt-3">
              <PrimaryButton label="Save changes" onPress={save} busy={busy} disabled={detailLoading} />
              <SecureNote />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row justify-between gap-4 py-2.5 ${last ? '' : 'border-b border-hairline'}`}>
      <Text className="text-[13.5px] text-graphite">{label}</Text>
      <Text className="flex-1 text-right text-[13.5px] font-medium text-ink" numberOfLines={1}>{value}</Text>
    </View>
  );
}

function DocPreview({ kind, name, uri }: { kind: string; name?: string | null; uri?: string }) {
  const label = kind.replace(/[_-]/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  return (
    <View className="overflow-hidden rounded-2xl border border-hairline bg-surface2">
      {uri ? <Image source={{ uri }} style={{ width: '100%', height: 150 }} contentFit="cover" /> : null}
      <View className="flex-row items-center justify-between px-4 py-2.5">
        <Text className="flex-1 text-[13px] font-semibold text-ink" numberOfLines={1}>{label}</Text>
        {name ? <Text className="ml-2 text-[11.5px] text-graphite-light" numberOfLines={1}>{name}</Text> : null}
      </View>
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
