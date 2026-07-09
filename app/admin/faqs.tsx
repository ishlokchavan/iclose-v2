import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Modal, Alert } from 'react-native';
import { useFocusEffect, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, X, Pencil, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { adminListFaqs, adminUpsertFaq, adminDeleteFaq, type FaqRow } from '@/lib/admin';
import { GlassBg } from '@/components/Glass';
import { Press, FadeIn } from '@/components/Press';
import { colors } from '@/theme/tokens';
import { AdminHeader, Loading, Empty, Field, Chip, PrimaryButton } from './_ui';
import { SecureNote } from '@/components/ListKit';

type Audience = FaqRow['audience'];
const AUDIENCES: Audience[] = ['all', 'buyer', 'broker', 'seller'];
const AUDIENCE_LABEL: Record<Audience, string> = { all: 'All', buyer: 'Buyer', broker: 'Broker', seller: 'Seller' };

type Draft = Partial<FaqRow> & { question: string; answer: string };
const EMPTY: Draft = { question: '', answer: '', audience: 'all', position: 0, published: true };

export default function AdminFaqs() {
  const insets = useSafeAreaInsets();
  const { isAdmin, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => { setRows(await adminListFaqs()); }, []);
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  const groups = useMemo(() => {
    return AUDIENCES.map((a) => ({ audience: a, items: rows.filter((r) => r.audience === a) })).filter((g) => g.items.length > 0);
  }, [rows]);

  async function save() {
    if (!draft) return;
    if (!draft.question.trim() || !draft.answer.trim()) { Alert.alert('Question and answer required'); return; }
    setBusy(true);
    try {
      await adminUpsertFaq({
        ...draft,
        question: draft.question.trim(),
        answer: draft.answer.trim(),
        audience: draft.audience ?? 'all',
        position: Number(draft.position) || 0,
        published: draft.published ?? true,
      });
      setDraft(null);
      await load();
    } catch (e) {
      Alert.alert('Could not save', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function remove(f: FaqRow) {
    Alert.alert('Delete FAQ', 'Delete this question?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await adminDeleteFaq(f.id); await load(); }
          catch (e) { Alert.alert('Could not delete', (e as Error).message); }
        },
      },
    ]);
  }

  if (!authLoading && !isAdmin) return <Redirect href="/" />;

  return (
    <View className="flex-1">
      <GlassBg />
      <AdminHeader
        title="FAQs"
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
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 110 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
          {rows.length === 0 ? (
            <Empty text="No FAQs yet. Tap + to add one." />
          ) : (
            groups.map((g) => (
              <View key={g.audience} className="mb-5">
                <Text className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-graphite">{AUDIENCE_LABEL[g.audience]}</Text>
                <View className="gap-3">
                  {g.items.map((f, i) => (
                    <FadeIn key={f.id} delay={Math.min(i, 8) * 30}>
                      <View className="rounded-apple border border-hairline bg-surface p-4">
                        <View className="flex-row items-start justify-between gap-2">
                          <Text className="flex-1 text-[15px] font-semibold text-ink">{f.question}</Text>
                          <View className="flex-row gap-2">
                            <Press onPress={() => setDraft({ ...f })} className="h-8 w-8 items-center justify-center rounded-full bg-surface2">
                              <Pencil size={15} color={colors.ink} />
                            </Press>
                            <Press onPress={() => remove(f)} className="h-8 w-8 items-center justify-center rounded-full bg-surface2">
                              <Trash2 size={15} color={colors.ink} />
                            </Press>
                          </View>
                        </View>
                        <Text className="mt-1.5 text-[13.5px] text-graphite">{f.answer}</Text>
                        <Text className="mt-2 text-[11.5px] text-graphite-light">
                          #{f.position} · {f.published ? 'Published' : 'Hidden'}
                        </Text>
                      </View>
                    </FadeIn>
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={!!draft} transparent animationType="slide" onRequestClose={() => setDraft(null)}>
        <View className="flex-1 justify-end bg-black/60">
          <View style={{ paddingBottom: insets.bottom + 20 }} className="rounded-t-[24px] border-t border-hairline bg-paper px-5 pt-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[18px] font-semibold text-ink">{draft?.id ? 'Edit FAQ' : 'New FAQ'}</Text>
              <Press onPress={() => setDraft(null)} className="h-9 w-9 items-center justify-center rounded-full bg-surface2">
                <X size={19} color={colors.ink} />
              </Press>
            </View>
            {draft ? (
              <ScrollView style={{ maxHeight: 440 }} keyboardShouldPersistTaps="handled">
                <View className="gap-3 pb-4">
                  <Field label="Question" value={draft.question} onChangeText={(t) => setDraft({ ...draft, question: t })} placeholder="Question" multiline />
                  <Field label="Answer" value={draft.answer} onChangeText={(t) => setDraft({ ...draft, answer: t })} placeholder="Answer" multiline />
                  <View>
                    <Text className="mb-2 text-[13px] font-medium text-graphite">Audience</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {AUDIENCES.map((a) => (
                        <Chip key={a} label={AUDIENCE_LABEL[a]} active={(draft.audience ?? 'all') === a} onPress={() => setDraft({ ...draft, audience: a })} />
                      ))}
                    </View>
                  </View>
                  <Field label="Position" value={String(draft.position ?? 0)} onChangeText={(t) => setDraft({ ...draft, position: Number(t.replace(/[^0-9]/g, '')) || 0 })} placeholder="0" keyboardType="number-pad" />
                  <Press
                    onPress={() => setDraft({ ...draft, published: !(draft.published ?? true) })}
                    className={`flex-row items-center justify-between rounded-2xl border px-4 py-3.5 ${(draft.published ?? true) ? 'border-accent bg-accent/10' : 'border-hairline bg-surface2'}`}
                  >
                    <Text className="text-[14.5px] font-medium text-ink">Published</Text>
                    <View className={`h-6 w-6 items-center justify-center rounded-full ${(draft.published ?? true) ? 'bg-accent' : 'bg-surface'}`}>
                      {(draft.published ?? true) ? <Text style={{ color: colors.onAccent }} className="text-[13px] font-bold">✓</Text> : null}
                    </View>
                  </Press>
                </View>
              </ScrollView>
            ) : null}
            <PrimaryButton label="Save FAQ" onPress={save} busy={busy} />
            <SecureNote text="Published FAQs go live for the selected audience immediately." />
          </View>
        </View>
      </Modal>
    </View>
  );
}
