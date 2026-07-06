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
      <Pressable onPress={() => { setEm(emirate); setOpen(true); }} className="flex-row items-center gap-2.5 rounded-2xl border border-white/50 bg-white/60 px-4 py-3.5">
        <MapPin size={18} color={colors.accent} />
        <Text className={`flex-1 text-[15px] ${area ? 'text-ink' : 'text-graphite-light'}`}>{area ? `${emirate} · ${area}` : 'Select location'}</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <View className="max-h-[80%] rounded-t-[28px] bg-white px-4 pt-3">
            <View className="flex-row items-center justify-between py-2">
              <Text className="text-[16px] font-semibold text-ink">Location</Text>
              <Pressable onPress={() => setOpen(false)} className="h-9 w-9 items-center justify-center rounded-full bg-black/5"><X size={18} color={colors.ink} /></Pressable>
            </View>

            {/* Emirate chips */}
            <ScrollableChips value={em} onChange={(e) => { setEm(e); setQ(''); }} />

            {/* Search */}
            <View className="mt-3 flex-row items-center gap-2 rounded-2xl border border-hairline bg-white px-3.5 py-2.5">
              <Search size={17} color={colors.graphiteLight} />
              <TextInput value={q} onChangeText={setQ} placeholder={`Search in ${em}…`} placeholderTextColor={colors.graphiteLight} className="flex-1 text-[15px] text-ink" autoFocus />
            </View>

            <FlatList
              className="mt-1"
              data={list}
              keyExtractor={(d) => d}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable onPress={() => { onChange(em, item); setOpen(false); }} className="flex-row items-center gap-3 border-b border-black/5 px-1 py-3.5">
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
      contentContainerStyle={{ gap: 8 }}
      renderItem={({ item }) => (
        <Pressable onPress={() => onChange(item)} className={`rounded-full px-3.5 py-2 ${value === item ? 'bg-ink' : 'bg-black/5'}`}>
          <Text className={`text-[13px] font-semibold ${value === item ? 'text-white' : 'text-ink'}`}>{item}</Text>
        </Pressable>
      )}
    />
  );
}
