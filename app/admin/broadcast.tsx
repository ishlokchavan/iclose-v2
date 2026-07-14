import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, Platform, RefreshControl } from 'react-native';
import { useFocusEffect, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Megaphone, Bell, BellOff, Users, ShoppingBag, Briefcase, Clock, Repeat, X, type LucideIcon } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import {
  adminCreateBroadcast, adminListBroadcasts, adminCancelBroadcast,
  type BroadcastRow, type BroadcastAudience,
} from '@/lib/admin';
import { GlassBg } from '@/components/Glass';
import { Press, FadeIn } from '@/components/Press';
import { formatDate, formatTime } from '@/lib/format';
import { colors } from '@/theme/tokens';
import { AdminHeader, Field, PrimaryButton, Empty } from './_ui';

type When = 'now' | 'schedule';
type RepeatKey = 'once' | 'hourly' | 'daily' | 'weekly';
const REPEAT_MINUTES: Record<RepeatKey, number | null> = { once: null, hourly: 60, daily: 1440, weekly: 10080 };

const AUDIENCES: { key: BroadcastAudience; label: string; Icon: LucideIcon }[] = [
  { key: 'all', label: 'Everyone', Icon: Users },
  { key: 'buyer', label: 'Buyers', Icon: ShoppingBag },
  { key: 'broker', label: 'Brokers', Icon: Briefcase },
];
const REPEATS: { key: RepeatKey; label: string }[] = [
  { key: 'once', label: 'Once' }, { key: 'hourly', label: 'Hourly' },
  { key: 'daily', label: 'Daily' }, { key: 'weekly', label: 'Weekly' },
];

function Segment<T extends string>({ options, value, onChange }: { options: { key: T; label: string; Icon?: LucideIcon }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map(({ key, label, Icon }) => {
        const active = value === key;
        return (
          <Press key={key} onPress={() => onChange(key)} className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-2 ${active ? 'bg-accent' : 'border border-hairline bg-surface2'}`}>
            {Icon ? <Icon size={14} color={active ? colors.onAccent : colors.graphite} /> : null}
            <Text className="text-[13px] font-semibold" style={{ color: active ? colors.onAccent : colors.ink }}>{label}</Text>
          </Press>
        );
      })}
    </View>
  );
}

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  sent: { bg: 'rgba(52,211,153,0.16)', fg: '#34d399' },
  scheduled: { bg: 'rgba(245,158,11,0.16)', fg: '#fbbf24' },
  recurring: { bg: 'rgba(158,255,0,0.16)', fg: '#9eff00' },
  cancelled: { bg: 'rgba(160,160,166,0.16)', fg: '#a1a1a6' },
};

export default function AdminBroadcast() {
  const insets = useSafeAreaInsets();
  const { isAdmin, loading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<BroadcastAudience>('all');
  const [push, setPush] = useState(true);
  const [when, setWhen] = useState<When>('now');
  const [repeat, setRepeat] = useState<RepeatKey>('once');
  const [date, setDate] = useState(() => new Date(Date.now() + 60 * 60 * 1000));
  const [showPicker, setShowPicker] = useState(false);
  const [busy, setBusy] = useState(false);

  const [rows, setRows] = useState<BroadcastRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => { setRows(await adminListBroadcasts(50)); }, []);
  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  async function submit() {
    if (!title.trim()) return Alert.alert('Missing title', 'Add a title for the notification.');
    const scheduled = when === 'schedule' ? date : null;
    const repeatMin = REPEAT_MINUTES[repeat];
    const audLabel = AUDIENCES.find((a) => a.key === audience)?.label ?? 'Everyone';
    const summary = scheduled
      ? `Schedule for ${audLabel} on ${formatDate(scheduled.toISOString())} ${formatTime(scheduled.toISOString())}${repeatMin ? `, repeating ${repeat}` : ''}?`
      : `Send now to ${audLabel}${repeatMin ? `, then repeat ${repeat}` : ''}?`;

    Alert.alert('Send notification', summary, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: scheduled ? 'Schedule' : 'Send',
        onPress: async () => {
          setBusy(true);
          try {
            await adminCreateBroadcast({
              title: title.trim(),
              body: body.trim() || null,
              audience,
              send_push: push,
              scheduled_at: scheduled ? scheduled.toISOString() : null,
              repeat_every_minutes: repeatMin,
            });
            setTitle(''); setBody(''); setRepeat('once'); setWhen('now');
            await load();
            Alert.alert('Done', scheduled ? 'Broadcast scheduled.' : 'Broadcast sent.');
          } catch (e) {
            Alert.alert('Could not send', (e as Error).message);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  function cancel(b: BroadcastRow) {
    Alert.alert('Cancel broadcast?', 'It will stop sending. Already-delivered notifications are unaffected.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel it', style: 'destructive', onPress: async () => { try { await adminCancelBroadcast(b.id); await load(); } catch (e) { Alert.alert('Error', (e as Error).message); } } },
    ]);
  }

  if (!authLoading && !isAdmin) return <Redirect href="/" />;

  return (
    <View className="flex-1">
      <GlassBg />
      <AdminHeader title="Notifications" insetTop={insets.top} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: insets.bottom + 110 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <View className="mb-3 flex-row items-center gap-2">
          <Megaphone size={18} color={colors.accent} />
          <Text className="text-[15px] font-semibold text-ink">Send a custom notification</Text>
        </View>

        <View className="gap-3.5 rounded-apple border border-hairline bg-surface p-4">
          <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. New off-plan launch in Dubai Marina" />
          <Field label="Message" value={body} onChangeText={setBody} placeholder="Optional details…" multiline />

          <View>
            <Text className="mb-1.5 text-[13px] font-medium text-graphite">Audience</Text>
            <Segment options={AUDIENCES} value={audience} onChange={setAudience} />
          </View>

          <Press onPress={() => setPush((v) => !v)} className="flex-row items-center justify-between rounded-2xl border border-hairline bg-surface2 px-4 py-3">
            <View className="flex-row items-center gap-2">
              {push ? <Bell size={17} color={colors.accent} /> : <BellOff size={17} color={colors.graphiteLight} />}
              <Text className="text-[14px] font-medium text-ink">Also send as push</Text>
            </View>
            <View className={`h-6 w-10 justify-center rounded-full px-0.5 ${push ? 'bg-accent' : 'bg-surface'}`}>
              <View className={`h-5 w-5 rounded-full bg-white ${push ? 'self-end' : 'self-start'}`} />
            </View>
          </Press>

          <View>
            <Text className="mb-1.5 text-[13px] font-medium text-graphite">When</Text>
            <Segment
              options={[{ key: 'now' as When, label: 'Send now', Icon: Clock }, { key: 'schedule' as When, label: 'Schedule', Icon: Clock }]}
              value={when}
              onChange={setWhen}
            />
          </View>

          {when === 'schedule' ? (
            <View>
              <Press onPress={() => setShowPicker((v) => !v)} className="flex-row items-center justify-between rounded-2xl border border-hairline bg-surface2 px-4 py-3.5">
                <Text className="text-[14px] font-medium text-ink">{formatDate(date.toISOString())} · {formatTime(date.toISOString())}</Text>
                <Clock size={16} color={colors.graphiteLight} />
              </Press>
              {showPicker ? (
                <DateTimePicker
                  value={date}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  themeVariant="dark"
                  minimumDate={new Date()}
                  onChange={(_e, d) => { if (Platform.OS !== 'ios') setShowPicker(false); if (d) setDate(d); }}
                />
              ) : null}
            </View>
          ) : null}

          <View>
            <Text className="mb-1.5 flex-row text-[13px] font-medium text-graphite">Repeat</Text>
            <Segment options={REPEATS} value={repeat} onChange={setRepeat} />
            {repeat !== 'once' ? (
              <View className="mt-1.5 flex-row items-center gap-1.5">
                <Repeat size={12} color={colors.graphiteLight} />
                <Text className="text-[11.5px] text-graphite-light">Repeats {repeat} until you cancel it.</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View className="mt-4">
          <PrimaryButton label={when === 'schedule' ? 'Schedule notification' : 'Send notification'} onPress={submit} busy={busy} />
        </View>

        {/* History / scheduled */}
        <Text className="mb-2 mt-7 text-[15px] font-semibold text-ink">Recent & scheduled</Text>
        {rows.length === 0 ? (
          <Empty text="No broadcasts yet." />
        ) : (
          <View className="gap-2.5">
            {rows.map((b, i) => {
              const st = STATUS_STYLE[b.status] ?? STATUS_STYLE.cancelled;
              const cancellable = b.status === 'scheduled' || b.status === 'recurring';
              const audLabel = AUDIENCES.find((a) => a.key === b.audience)?.label ?? b.audience;
              return (
                <FadeIn key={b.id} delay={Math.min(i, 10) * 20}>
                  <View className="rounded-apple border border-hairline bg-surface p-4">
                    <View className="flex-row items-center justify-between gap-2">
                      <View style={{ backgroundColor: st.bg }} className="self-start rounded-full px-2.5 py-1">
                        <Text style={{ color: st.fg }} className="text-[11px] font-semibold capitalize">{b.status}</Text>
                      </View>
                      {cancellable ? (
                        <Press onPress={() => cancel(b)} className="flex-row items-center gap-1 rounded-full bg-surface2 px-2.5 py-1">
                          <X size={12} color={colors.graphite} /><Text className="text-[11.5px] font-medium text-graphite">Cancel</Text>
                        </Press>
                      ) : null}
                    </View>
                    <Text className="mt-2 text-[15px] font-semibold text-ink" numberOfLines={1}>{b.title}</Text>
                    {b.body ? <Text className="text-[12.5px] text-graphite" numberOfLines={2}>{b.body}</Text> : null}
                    <Text className="mt-1 text-[11.5px] text-graphite-light">
                      {audLabel}
                      {b.repeat_every_minutes ? ' · recurring' : ''}
                      {b.next_run_at ? ` · next ${formatDate(b.next_run_at)} ${formatTime(b.next_run_at)}` : ''}
                      {b.last_sent_at ? ` · sent ${formatDate(b.last_sent_at)}` : ''}
                    </Text>
                  </View>
                </FadeIn>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
