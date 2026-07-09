import { useState } from 'react';
import { View, Text, ScrollView, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowDownUp, ShieldCheck, X, CalendarRange, SlidersHorizontal } from 'lucide-react-native';
import { Press } from './Press';
import { PERIOD_LABEL, PERIOD_ORDER, type Period, type PeriodState, type SortDir } from '@/lib/dates';
import { colors } from '@/theme/tokens';

/**
 * Shared list chrome: PeriodFilter (today/yesterday/7d/30d/custom range),
 * SortToggle (newest/oldest), FilterControl (compact button opening a
 * period + sort bottom sheet), DayHeader for date-grouped sections, and
 * SecureNote — the reassurance line under save/submit buttons.
 */

const fmtDay = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const fmtRange = (from: Date, to: Date) => `${fmtDay(from)} – ${fmtDay(to)}`;

export function PeriodFilter({ value, onChange }: { value: PeriodState; onChange: (v: PeriodState) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [from, setFrom] = useState<Date>(value.from ?? new Date(Date.now() - 6 * 86_400_000));
  const [to, setTo] = useState<Date>(value.to ?? new Date());

  function pick(p: Period) {
    if (p === 'custom') { setPickerOpen(true); return; }
    onChange({ period: p });
  }

  const customLabel = value.period === 'custom' && value.from && value.to
    ? fmtRange(value.from, value.to)
    : PERIOD_LABEL.custom;

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4" contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {PERIOD_ORDER.map((p) => {
          const active = value.period === p;
          const label = p === 'custom' ? customLabel : PERIOD_LABEL[p];
          return (
            <Press key={p} onPress={() => pick(p)} className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-2 ${active ? 'bg-accent' : 'border border-hairline bg-surface2'}`}>
              {p === 'custom' ? <CalendarRange size={13} color={active ? colors.onAccent : colors.graphite} /> : null}
              <Text className="text-[13px] font-semibold" style={{ color: active ? colors.onAccent : colors.ink }}>{label}</Text>
            </Press>
          );
        })}
      </ScrollView>

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-[24px] border-t border-hairline bg-paper px-5 pb-10 pt-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[17px] font-semibold text-ink">Custom period</Text>
              <Press onPress={() => setPickerOpen(false)} className="h-9 w-9 items-center justify-center rounded-full bg-surface2"><X size={18} color={colors.ink} /></Press>
            </View>
            <View className="mb-4 flex-row gap-3">
              <RangeSide label="From" date={from} max={to} onChange={setFrom} />
              <RangeSide label="To" date={to} min={from} onChange={setTo} />
            </View>
            <Press onPress={() => { onChange({ period: 'custom', from, to }); setPickerOpen(false); }} className="items-center rounded-full bg-accent py-4">
              <Text className="text-[15px] font-semibold" style={{ color: colors.onAccent }}>Apply period</Text>
            </Press>
          </View>
        </View>
      </Modal>
    </>
  );
}

function RangeSide({ label, date, min, max, onChange }: { label: string; date: Date; min?: Date; max?: Date; onChange: (d: Date) => void }) {
  const [open, setOpen] = useState(Platform.OS === 'ios');
  return (
    <View className="flex-1">
      <Text className="mb-1.5 text-[12.5px] font-medium text-graphite">{label}</Text>
      {Platform.OS === 'ios' ? (
        <View className="items-start overflow-hidden rounded-2xl border border-hairline bg-surface2">
          <DateTimePicker value={date} mode="date" display="compact" themeVariant="dark" minimumDate={min} maximumDate={max}
            onChange={(_, d) => d && onChange(d)} style={{ margin: 6 }} />
        </View>
      ) : (
        <>
          <Press onPress={() => setOpen(true)} className="rounded-2xl border border-hairline bg-surface2 px-4 py-3.5">
            <Text className="text-[15px] text-ink">{date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          </Press>
          {open ? (
            <DateTimePicker value={date} mode="date" display="default" minimumDate={min} maximumDate={max}
              onChange={(_, d) => { setOpen(false); if (d) onChange(d); }} />
          ) : null}
        </>
      )}
    </View>
  );
}

/**
 * Compact filter button (period + sort) — replaces the stacked PeriodFilter
 * row + SortToggle on list screens. Shows a lime dot when filters are
 * non-default and opens a bottom sheet with local draft state committed
 * only on Apply.
 */
export function FilterControl({ period, onPeriod, sort, onSort }: { period: PeriodState; onPeriod: (v: PeriodState) => void; sort: SortDir; onSort: (v: SortDir) => void }) {
  const [open, setOpen] = useState(false);
  // Local draft — committed to the parent only when the user taps Apply.
  const [dPeriod, setDPeriod] = useState<Period>(period.period);
  const [dSort, setDSort] = useState<SortDir>(sort);
  const [from, setFrom] = useState<Date>(() => period.from ?? new Date(Date.now() - 6 * 86_400_000));
  const [to, setTo] = useState<Date>(() => period.to ?? new Date());

  const nonDefault = period.period !== 'all' || sort !== 'newest';

  function openSheet() {
    setDPeriod(period.period);
    setDSort(sort);
    setFrom(period.from ?? new Date(Date.now() - 6 * 86_400_000));
    setTo(period.to ?? new Date());
    setOpen(true);
  }

  function apply() {
    onPeriod(dPeriod === 'custom' ? { period: 'custom', from, to } : { period: dPeriod });
    onSort(dSort);
    setOpen(false);
  }

  return (
    <>
      <Press onPress={openSheet} className="h-10 w-10 items-center justify-center rounded-full border border-hairline bg-surface2">
        <SlidersHorizontal size={17} color={colors.ink} />
        {nonDefault ? <View className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-paper bg-accent" /> : null}
      </Press>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-[24px] border-t border-hairline bg-paper px-5 pb-10 pt-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[17px] font-semibold text-ink">Filters</Text>
              <Press onPress={() => setOpen(false)} className="h-9 w-9 items-center justify-center rounded-full bg-surface2"><X size={18} color={colors.ink} /></Press>
            </View>

            <Text className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-graphite">Time period</Text>
            <View className="flex-row flex-wrap gap-2">
              {PERIOD_ORDER.map((p) => {
                const active = dPeriod === p;
                const label = p === 'custom' && active ? fmtRange(from, to) : PERIOD_LABEL[p];
                return (
                  <Press key={p} onPress={() => setDPeriod(p)} className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-2 ${active ? 'bg-accent' : 'border border-hairline bg-surface2'}`}>
                    {p === 'custom' ? <CalendarRange size={13} color={active ? colors.onAccent : colors.graphite} /> : null}
                    <Text className="text-[13px] font-semibold" style={{ color: active ? colors.onAccent : colors.ink }}>{label}</Text>
                  </Press>
                );
              })}
            </View>
            {dPeriod === 'custom' ? (
              <View className="mt-3 flex-row gap-3">
                <RangeSide label="From" date={from} max={to} onChange={setFrom} />
                <RangeSide label="To" date={to} min={from} onChange={setTo} />
              </View>
            ) : null}

            <Text className="mb-2 mt-5 text-[13px] font-semibold uppercase tracking-wide text-graphite">Sort</Text>
            <View className="flex-row gap-2">
              {(['newest', 'oldest'] as const).map((s) => {
                const active = dSort === s;
                return (
                  <Press key={s} onPress={() => setDSort(s)} className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-2 ${active ? 'bg-accent' : 'border border-hairline bg-surface2'}`}>
                    <ArrowDownUp size={13} color={active ? colors.onAccent : colors.graphite} />
                    <Text className="text-[13px] font-semibold" style={{ color: active ? colors.onAccent : colors.ink }}>{s === 'newest' ? 'Newest first' : 'Oldest first'}</Text>
                  </Press>
                );
              })}
            </View>

            <View className="mt-6 flex-row items-center gap-3">
              <Press onPress={() => { setDPeriod('all'); setDSort('newest'); }} className="rounded-full px-4 py-4">
                <Text className="text-[15px] font-semibold text-graphite">Reset</Text>
              </Press>
              <Press onPress={apply} className="flex-1 items-center rounded-full bg-accent py-4">
                <Text className="text-[15px] font-semibold" style={{ color: colors.onAccent }}>Apply</Text>
              </Press>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function SortToggle({ value, onChange }: { value: SortDir; onChange: (v: SortDir) => void }) {
  return (
    <Press onPress={() => onChange(value === 'newest' ? 'oldest' : 'newest')} className="flex-row items-center gap-1.5 rounded-full border border-hairline bg-surface2 px-3 py-2">
      <ArrowDownUp size={13} color={colors.graphite} />
      <Text className="text-[12.5px] font-semibold text-ink">{value === 'newest' ? 'Newest first' : 'Oldest first'}</Text>
    </Press>
  );
}

/** Sticky-feeling section header for date-grouped lists. */
export function DayHeader({ label, right }: { label: string; right?: string }) {
  return (
    <View className="mb-2 mt-1 flex-row items-end justify-between px-1">
      <Text className="text-[13px] font-semibold uppercase tracking-wide text-graphite">{label}</Text>
      {right ? <Text className="text-[13px] font-bold text-ink">{right}</Text> : null}
    </View>
  );
}

/** Reassurance line under save/submit actions. */
export function SecureNote({ text = 'Encrypted in transit & stored securely. Only our team can see this.' }: { text?: string }) {
  return (
    <View className="mt-2.5 flex-row items-center justify-center gap-1.5 px-4">
      <ShieldCheck size={13} color={colors.graphite} />
      <Text className="text-center text-[12px] text-graphite">{text}</Text>
    </View>
  );
}
