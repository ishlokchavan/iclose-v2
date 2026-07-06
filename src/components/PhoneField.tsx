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

/** Phone input with a country-code picker (UAE default, with flags). Emits the
 *  full number (dial + local) via onChange. */
export function PhoneField({ value, onChange }: { value: string; onChange: (full: string) => void }) {
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [open, setOpen] = useState(false);

  // Local part = value with the dial code stripped.
  const local = useMemo(() => value.replace(country.dial, '').replace(/^\+/, '').trim(), [value, country]);

  const setLocal = (text: string) => onChange(`${country.dial} ${text.replace(/[^0-9]/g, '')}`.trim());
  const pick = (c: (typeof COUNTRIES)[number]) => {
    setCountry(c);
    setOpen(false);
    onChange(`${c.dial} ${local}`.trim());
  };

  return (
    <>
      <View className="flex-row gap-2">
        <Pressable onPress={() => setOpen(true)} className="flex-row items-center gap-1.5 rounded-2xl border border-white/50 bg-white/60 px-3 py-3.5">
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
          className="flex-1 rounded-2xl border border-white/50 bg-white/60 px-4 py-3.5 text-base text-ink"
        />
      </View>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} className="flex-1 justify-end bg-black/30">
          <Pressable className="max-h-[70%] rounded-t-[28px] bg-white px-2 pt-2" onPress={(e) => e.stopPropagation()}>
            <View className="flex-row items-center justify-between px-3 py-3">
              <Text className="text-[16px] font-semibold text-ink">Country</Text>
              <Pressable onPress={() => setOpen(false)} className="h-9 w-9 items-center justify-center rounded-full bg-black/5"><X size={18} color={colors.ink} /></Pressable>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(c) => c.code}
              renderItem={({ item }) => (
                <Pressable onPress={() => pick(item)} className="flex-row items-center gap-3 px-4 py-3.5">
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
