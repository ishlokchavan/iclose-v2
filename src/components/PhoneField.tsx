import { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, FlatList } from 'react-native';
import { ChevronDown, X, Check, Search } from 'lucide-react-native';
import { colors } from '@/theme/tokens';

/** Countries — flag + dial code. UAE & the GCC first (primary market), then the
 *  large expat communities in the UAE, then other common ones. */
const COUNTRIES = [
  { code: 'AE', flag: '🇦🇪', dial: '+971', name: 'United Arab Emirates' },
  { code: 'SA', flag: '🇸🇦', dial: '+966', name: 'Saudi Arabia' },
  { code: 'QA', flag: '🇶🇦', dial: '+974', name: 'Qatar' },
  { code: 'KW', flag: '🇰🇼', dial: '+965', name: 'Kuwait' },
  { code: 'BH', flag: '🇧🇭', dial: '+973', name: 'Bahrain' },
  { code: 'OM', flag: '🇴🇲', dial: '+968', name: 'Oman' },
  { code: 'IN', flag: '🇮🇳', dial: '+91', name: 'India' },
  { code: 'PK', flag: '🇵🇰', dial: '+92', name: 'Pakistan' },
  { code: 'BD', flag: '🇧🇩', dial: '+880', name: 'Bangladesh' },
  { code: 'LK', flag: '🇱🇰', dial: '+94', name: 'Sri Lanka' },
  { code: 'PH', flag: '🇵🇭', dial: '+63', name: 'Philippines' },
  { code: 'NP', flag: '🇳🇵', dial: '+977', name: 'Nepal' },
  { code: 'EG', flag: '🇪🇬', dial: '+20', name: 'Egypt' },
  { code: 'JO', flag: '🇯🇴', dial: '+962', name: 'Jordan' },
  { code: 'LB', flag: '🇱🇧', dial: '+961', name: 'Lebanon' },
  { code: 'SY', flag: '🇸🇾', dial: '+963', name: 'Syria' },
  { code: 'IQ', flag: '🇮🇶', dial: '+964', name: 'Iraq' },
  { code: 'IR', flag: '🇮🇷', dial: '+98', name: 'Iran' },
  { code: 'TR', flag: '🇹🇷', dial: '+90', name: 'Türkiye' },
  { code: 'GB', flag: '🇬🇧', dial: '+44', name: 'United Kingdom' },
  { code: 'US', flag: '🇺🇸', dial: '+1', name: 'United States' },
  { code: 'CA', flag: '🇨🇦', dial: '+1', name: 'Canada' },
  { code: 'RU', flag: '🇷🇺', dial: '+7', name: 'Russia' },
  { code: 'FR', flag: '🇫🇷', dial: '+33', name: 'France' },
  { code: 'DE', flag: '🇩🇪', dial: '+49', name: 'Germany' },
  { code: 'IT', flag: '🇮🇹', dial: '+39', name: 'Italy' },
  { code: 'ES', flag: '🇪🇸', dial: '+34', name: 'Spain' },
  { code: 'NL', flag: '🇳🇱', dial: '+31', name: 'Netherlands' },
  { code: 'CN', flag: '🇨🇳', dial: '+86', name: 'China' },
  { code: 'ZA', flag: '🇿🇦', dial: '+27', name: 'South Africa' },
  { code: 'NG', flag: '🇳🇬', dial: '+234', name: 'Nigeria' },
  { code: 'KE', flag: '🇰🇪', dial: '+254', name: 'Kenya' },
  { code: 'AU', flag: '🇦🇺', dial: '+61', name: 'Australia' },
  { code: 'SG', flag: '🇸🇬', dial: '+65', name: 'Singapore' },
  { code: 'MY', flag: '🇲🇾', dial: '+60', name: 'Malaysia' },
  { code: 'ID', flag: '🇮🇩', dial: '+62', name: 'Indonesia' },
  { code: 'AF', flag: '🇦🇫', dial: '+93', name: 'Afghanistan' },
  { code: 'MA', flag: '🇲🇦', dial: '+212', name: 'Morocco' },
  { code: 'UA', flag: '🇺🇦', dial: '+380', name: 'Ukraine' },
];

// Longest dial code first so +971 matches before +9-anything, +91 before +9, etc.
const BY_DIAL_LEN = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

/** Phone input with a country-code picker (UAE default, with flags). Emits the
 *  full number (dial + local) via onChange. The selected country is DERIVED from
 *  the current value, so an already-saved number shows the right flag/code. */
export function PhoneField({ value, onChange }: { value: string; onChange: (full: string) => void }) {
  const [open, setOpen] = useState(false);
  const [cq, setCq] = useState('');

  const filtered = useMemo(() => {
    const q = cq.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.dial.includes(q));
  }, [cq]);

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
        <Pressable onPress={() => { setOpen(false); setCq(''); }} className="flex-1 justify-end bg-black/40">
          <Pressable style={{ height: '75%' }} className="rounded-t-[28px] border-t border-hairline bg-surface px-2 pt-2.5" onPress={(e) => e.stopPropagation()}>
            <View className="mb-1 items-center"><View className="h-1 w-10 rounded-full bg-hairline" /></View>
            <View className="flex-row items-center justify-between px-3 py-2">
              <Text className="text-[17px] font-semibold text-ink">Country</Text>
              <Pressable onPress={() => { setOpen(false); setCq(''); }} className="h-9 w-9 items-center justify-center rounded-full bg-surface2"><X size={18} color={colors.ink} /></Pressable>
            </View>
            <View className="mx-2 mb-1 flex-row items-center gap-2 rounded-2xl border border-hairline bg-surface2 px-3.5 py-2.5">
              <Search size={17} color={colors.graphiteLight} />
              <TextInput value={cq} onChangeText={setCq} placeholder="Search country or code…" placeholderTextColor={colors.graphiteLight} className="flex-1 text-[15px] text-ink" />
            </View>
            <FlatList
              data={filtered}
              keyExtractor={(c) => c.code + c.dial}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable onPress={() => { pick(item); setCq(''); }} className={`flex-row items-center gap-3 px-4 py-3.5 ${country.code === item.code ? 'bg-accent/10' : ''}`}>
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
