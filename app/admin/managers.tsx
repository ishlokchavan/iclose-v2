import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Modal, Alert } from 'react-native';
import { useFocusEffect, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Plus, X, Pencil, Trash2, UserCog } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { adminListManagers, adminUpsertManager, adminDeleteManager, type ManagerRow } from '@/lib/admin';
import { GlassBg } from '@/components/Glass';
import { Press, FadeIn } from '@/components/Press';
import { colors } from '@/theme/tokens';
import { AdminHeader, Loading, Empty, Field, PrimaryButton } from './_ui';

type Draft = Partial<ManagerRow> & { name: string };
const EMPTY: Draft = { name: '', title: '', photo_url: '', whatsapp_number: '', call_number: '', active: true, position: 0 };

export default function AdminManagers() {
  const insets = useSafeAreaInsets();
  const { isAdmin, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<ManagerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => { setRows(await adminListManagers()); }, []);
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  async function save() {
    if (!draft) return;
    if (!draft.name.trim()) { Alert.alert('Name required'); return; }
    setBusy(true);
    try {
      await adminUpsertManager({
        ...draft,
        name: draft.name.trim(),
        title: draft.title?.trim() || '',
        photo_url: draft.photo_url?.trim() || null,
        whatsapp_number: draft.whatsapp_number?.trim() || null,
        call_number: draft.call_number?.trim() || null,
        position: Number(draft.position) || 0,
      });
      setDraft(null);
      await load();
    } catch (e) {
      Alert.alert('Could not save', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function remove(m: ManagerRow) {
    Alert.alert('Remove manager', `Remove ${m.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try { await adminDeleteManager(m.id, m.name); await load(); }
          catch (e) { Alert.alert('Could not remove', (e as Error).message); }
        },
      },
    ]);
  }

  if (!authLoading && !isAdmin) return <Redirect href="/" />;

  return (
    <View className="flex-1">
      <GlassBg />
      <AdminHeader
        title="Account managers"
        insetTop={insets.top}
        right={
          <Press onPress={() => setDraft({ ...EMPTY, position: rows.length })} className="h-10 w-10 items-center justify-center rounded-full bg-accent">
            <Plus size={20} color={colors.onAccent} />
          </Press>
        }
      />

      {loading ? (
        <Loading />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          {rows.length === 0 ? (
            <Empty text="No account managers yet. Tap + to add one." />
          ) : (
            <View className="gap-3">
              {rows.map((m, i) => (
                <FadeIn key={m.id} delay={Math.min(i, 8) * 30}>
                  <View className="flex-row items-center gap-3 rounded-apple border border-hairline bg-surface p-4">
                    {m.photo_url ? (
                      <Image source={{ uri: m.photo_url }} style={{ width: 52, height: 52, borderRadius: 26 }} contentFit="cover" />
                    ) : (
                      <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-surface2">
                        <UserCog size={22} color={colors.accent} />
                      </View>
                    )}
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-[15.5px] font-semibold text-ink" numberOfLines={1}>{m.name}</Text>
                        <View className="h-2 w-2 rounded-full" style={{ backgroundColor: m.active ? colors.accent : colors.graphiteLight }} />
                      </View>
                      <Text className="text-[12.5px] text-graphite" numberOfLines={1}>{m.title || '—'}</Text>
                      <Text className="mt-0.5 text-[11.5px] text-graphite-light" numberOfLines={1}>
                        #{m.position}{m.whatsapp_number ? ` · WA ${m.whatsapp_number}` : ''}{m.call_number ? ` · ${m.call_number}` : ''}
                      </Text>
                    </View>
                    <Press onPress={() => setDraft({ ...m })} className="h-9 w-9 items-center justify-center rounded-full bg-surface2">
                      <Pencil size={16} color={colors.ink} />
                    </Press>
                    <Press onPress={() => remove(m)} className="h-9 w-9 items-center justify-center rounded-full bg-surface2">
                      <Trash2 size={16} color={colors.ink} />
                    </Press>
                  </View>
                </FadeIn>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={!!draft} transparent animationType="slide" onRequestClose={() => setDraft(null)}>
        <View className="flex-1 justify-end bg-black/60">
          <View style={{ paddingBottom: insets.bottom + 20 }} className="rounded-t-[24px] border-t border-hairline bg-paper px-5 pt-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[18px] font-semibold text-ink">{draft?.id ? 'Edit manager' : 'New manager'}</Text>
              <Press onPress={() => setDraft(null)} className="h-9 w-9 items-center justify-center rounded-full bg-surface2">
                <X size={19} color={colors.ink} />
              </Press>
            </View>
            {draft ? (
              <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
                <View className="gap-3 pb-4">
                  <Field label="Name" value={draft.name} onChangeText={(t) => setDraft({ ...draft, name: t })} placeholder="Full name" />
                  <Field label="Title" value={draft.title ?? ''} onChangeText={(t) => setDraft({ ...draft, title: t })} placeholder="e.g. Senior Advisor" />
                  <Field label="Photo URL" value={draft.photo_url ?? ''} onChangeText={(t) => setDraft({ ...draft, photo_url: t })} placeholder="https://…" autoCapitalize="none" />
                  <Field label="WhatsApp number" value={draft.whatsapp_number ?? ''} onChangeText={(t) => setDraft({ ...draft, whatsapp_number: t })} placeholder="9715…" keyboardType="phone-pad" />
                  <Field label="Call number" value={draft.call_number ?? ''} onChangeText={(t) => setDraft({ ...draft, call_number: t })} placeholder="+9715…" keyboardType="phone-pad" />
                  <Field label="Position" value={String(draft.position ?? 0)} onChangeText={(t) => setDraft({ ...draft, position: Number(t.replace(/[^0-9]/g, '')) || 0 })} placeholder="0" keyboardType="number-pad" />
                  <Press
                    onPress={() => setDraft({ ...draft, active: !draft.active })}
                    className={`flex-row items-center justify-between rounded-2xl border px-4 py-3.5 ${draft.active ? 'border-accent bg-accent/10' : 'border-hairline bg-surface2'}`}
                  >
                    <Text className="text-[14.5px] font-medium text-ink">Active (visible to users)</Text>
                    <View className={`h-6 w-6 items-center justify-center rounded-full ${draft.active ? 'bg-accent' : 'bg-surface'}`}>
                      {draft.active ? <Text style={{ color: colors.onAccent }} className="text-[13px] font-bold">✓</Text> : null}
                    </View>
                  </Press>
                </View>
              </ScrollView>
            ) : null}
            <PrimaryButton label="Save manager" onPress={save} busy={busy} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
