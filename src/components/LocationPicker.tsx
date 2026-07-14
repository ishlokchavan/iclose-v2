import { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { MapPin, X, Search, Check } from 'lucide-react-native';
import { EMIRATES, DISTRICTS, type Emirate } from '@/data/locations';
import { colors } from '@/theme/tokens';

/** Country (UAE) is fixed; user picks emirate (default Dubai) then a district
 *  from a searchable list. */
export function LocationPicker({ emirate, area, onChange }: { emirate: Emirate; area: string; onChange: (emirate: Emirate, area: string) => void }) {
  const [open, setOpen] = useState(false);
  const [em, setEm] = useState<Emirate>(emirate);
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const all = DISTRICTS[em] ?? [];
    return q.trim() ? all.filter((d) => d.toLowerCase().includes(q.toLowerCase())) : all;
  }, [em, q]);

  return (
    <>
      <Pressable onPress={() => { setEm(emirate); setOpen(true); }} className="flex-row items-center gap-2.5 rounded-2xl border border-hairline bg-surface2 px-4 py-3.5">
        <MapPin size={18} color={colors.accent} />
        <Text className={`flex-1 text-[15px] ${area ? 'text-ink' : 'text-graphite-light'}`}>{area ? `${emirate} · ${area}` : 'Select location'}</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{ height: '75%' }} className="rounded-t-[28px] border-t border-hairline bg-surface px-4 pt-2.5">
              {/* Grabber */}
              <View className="mb-1 items-center"><View className="h-1 w-10 rounded-full bg-hairline" /></View>

              <View className="flex-row items-center justify-between py-2">
                <Text className="text-[17px] font-semibold text-ink">Location</Text>
                <Pressable onPress={() => setOpen(false)} className="h-9 w-9 items-center justify-center rounded-full bg-surface2"><X size={18} color={colors.ink} /></Pressable>
              </View>

              {/* Emirate chips */}
              <ScrollableChips value={em} onChange={(e) => { setEm(e); setQ(''); }} />

              {/* Search */}
              <View className="mt-3 flex-row items-center gap-2 rounded-2xl border border-hairline bg-surface2 px-3.5 py-2.5">
                <Search size={17} color={colors.graphiteLight} />
                <TextInput value={q} onChangeText={setQ} placeholder={`Search in ${em}…`} placeholderTextColor={colors.graphiteLight} className="flex-1 text-[15px] text-ink" returnKeyType="search" />
              </View>

              <FlatList
                className="mt-1 flex-1"
                data={list}
                keyExtractor={(d) => d}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
                renderItem={({ item }) => (
                  <Pressable onPress={() => { onChange(em, item); setOpen(false); }} className="flex-row items-center gap-3 border-b border-hairline px-1 py-3.5">
                    <MapPin size={16} color={colors.graphiteLight} />
                    <Text className="flex-1 text-[15px] text-ink">{item}</Text>
                    {emirate === em && area === item ? <Check size={18} color={colors.accent} /> : null}
                  </Pressable>
                )}
                ListFooterComponent={
                  q.trim() && !list.includes(q.trim()) ? (
                    <Pressable onPress={() => { onChange(em, q.trim()); setOpen(false); }} className="px-1 py-3.5">
                      <Text className="text-[14.5px] font-medium text-accent">Use “{q.trim()}”</Text>
                    </Pressable>
                  ) : null
                }
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

function ScrollableChips({ value, onChange }: { value: Emirate; onChange: (e: Emirate) => void }) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={EMIRATES as unknown as Emirate[]}
      keyExtractor={(e) => e}
      contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
      renderItem={({ item }) => (
        <Pressable onPress={() => onChange(item)} className={`rounded-full px-3.5 py-2 ${value === item ? 'bg-accent' : 'border border-hairline bg-surface2'}`}>
          <Text className="text-[13px] font-semibold" style={{ color: value === item ? colors.onAccent : colors.ink }}>{item}</Text>
        </Pressable>
      )}
    />
  );
}
