import { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, FlatList } from 'react-native';
import { ChevronDown, X, Check } from 'lucide-react-native';
import { colors } from '@/theme/tokens';

/** Common countries for the UAE market — flag + dial code. UAE first. */
const COUNTRIES = [
  { code: 'AE', flag: '🇦🇪', dial: '+971', name: 'United Arab Emirates' },
  { code: 'SA', flag: '🇸🇦', dial: '+966', name: 'Saudi Arabia' },
  { code: 'QA', flag: '🇶🇦', dial: '+974', name: 'Qatar' },
  { code: 'KW', flag: '🇰🇼', dial: '+965', name: 'Kuwait' },
  { code: 'BH', flag: '🇧🇭', dial: '+973', name: 'Bahrain' },
  { code: 'OM', flag: '🇴🇲', dial: '+968', name: 'Oman' },
  { code: 'IN', flag: '🇮🇳', dial: '+91', name: 'India' },
  { code: 'PK', flag: '🇵🇰', dial: '+92', name: 'Pakistan' },
  { code: 'GB', flag: '🇬🇧', dial: '+44', name: 'United Kingdom' },
  { code: 'US', flag: '🇺🇸', dial: '+1', name: 'United States' },
  { code: 'EG', flag: '🇪🇬', dial: '+20', name: 'Egypt' },
  { code: 'RU', flag: '🇷🇺', dial: '+7', name: 'Russia' },
];

// Longest dial code first so +971 matches before +9-anything, +91 before +9, etc.
const BY_DIAL_LEN = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

/** Phone input with a country-code picker (UAE default, with flags). Emits the
 *  full number (dial + local) via onChange. The selected country is DERIVED from
 *  the current value, so an already-saved number shows the right flag/code. */
export function PhoneField({ value, onChange }: { value: string; onChange: (full: string) => void }) {
  const [open, setOpen] = useState(false);

  // Country = the one whose dial code prefixes the value (UAE fallback).
  const country = useMemo(() => {
    const v = value.replace(/[^\d+]/g, '');
    return BY_DIAL_LEN.find((c) => v.startsWith(c.dial)) ?? COUNTRIES[0];
  }, [value]);

  // Local part = value with the matched dial code stripped.
  const local = useMemo(() => value.replace(/[^\d+]/g, '').replace(country.dial, ''), [value, country]);

  const setLocal = (text: string) => onChange(`${country.dial} ${text.replace(/[^0-9]/g, '')}`.trim());
  const pick = (c: (typeof COUNTRIES)[number]) => {
    setOpen(false);
    onChange(`${c.dial} ${local}`.trim());
  };

  return (
    <>
      <View className="flex-row gap-2">
        <Pressable onPress={() => setOpen(true)} className="flex-row items-center gap-1.5 rounded-2xl border border-hairline bg-surface2 px-3 py-3.5">
          <Text className="text-[18px]">{country.flag}</Text>
          <Text className="text-[15px] font-medium text-ink">{country.dial}</Text>
          <ChevronDown size={15} color={colors.graphiteLight} />
        </Pressable>
        <TextInput
          value={local}
          onChangeText={setLocal}
          placeholder="50 123 4567"
          keyboardType="phone-pad"
          placeholderTextColor={colors.graphiteLight}
          className="flex-1 rounded-2xl border border-hairline bg-surface2 px-4 py-3.5 text-base text-ink"
        />
      </View>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} className="flex-1 justify-end bg-black/30">
          <Pressable className="max-h-[70%] rounded-t-[28px] bg-surface px-2 pt-2" onPress={(e) => e.stopPropagation()}>
            <View className="flex-row items-center justify-between px-3 py-3">
              <Text className="text-[16px] font-semibold text-ink">Country</Text>
              <Pressable onPress={() => setOpen(false)} className="h-9 w-9 items-center justify-center rounded-full bg-surface2"><X size={18} color={colors.ink} /></Pressable>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(c) => c.code}
              renderItem={({ item }) => (
                <Pressable onPress={() => pick(item)} className={`flex-row items-center gap-3 px-4 py-3.5 ${country.code === item.code ? 'bg-accent/10' : ''}`}>
                  <Text className="text-[22px]">{item.flag}</Text>
                  <Text className="flex-1 text-[15px] text-ink">{item.name}</Text>
                  <Text className="text-[14px] text-graphite">{item.dial}</Text>
                  {country.code === item.code ? <Check size={18} color={colors.accent} /> : null}
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
