import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, Switch, Linking } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import {
  submitInquiry, PROPERTY_CATEGORIES, PROPERTY_TYPES, ROLE_LABEL,
  type NewInquiry, type InquiryKind, type PropertyCategory,
} from '@/lib/deals';
import { CONTACT_WHATSAPP } from '@/lib/config';
import { GlassBg } from '@/components/Glass';
import { formatAed } from '@/lib/format';
import { colors } from '@/theme/tokens';

const KIND_FOR_ROLE = { buyer: 'buy', seller: 'sell', broker: 'close' } as const;
const TITLE: Record<InquiryKind, string> = { buy: 'New buying inquiry', sell: 'List your property', close: 'New deal inquiry' };
const BEDROOMS = ['Studio', '1', '2', '3', '4', '5+'];

export default function NewInquiryScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const role = profile?.role ?? 'buyer';
  const kind: InquiryKind = KIND_FOR_ROLE[role];

  const [category, setCategory] = useState<PropertyCategory>('Residential');
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [project, setProject] = useState('');
  const [area, setArea] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isReferral, setIsReferral] = useState(false);
  const [busy, setBusy] = useState(false);

  const isResidential = category === 'Residential';

  async function submit() {
    if (kind === 'buy' && !area.trim()) return Alert.alert('Add a location', 'Where do you want to buy?');
    if (kind !== 'buy' && !project.trim() && !area.trim()) return Alert.alert('Add details', 'Tell us the property or area.');
    setBusy(true);
    try {
      const amt = amount ? Number(amount.replace(/[^0-9.]/g, '')) : null;
      const beds = kind === 'buy' && isResidential && bedrooms ? (bedrooms === 'Studio' ? 0 : parseInt(bedrooms, 10)) : null;
      const typeLabel = kind === 'buy' && propertyType ? `${category} · ${propertyType}` : null;

      const input: NewInquiry =
        kind === 'buy'
          ? { kind, area: area.trim() || null, property_type: typeLabel, bedrooms: beds, budget_aed: amt, note: note.trim() || null, title: [propertyType, area.trim()].filter(Boolean).join(' in ') || 'Buying inquiry' }
          : kind === 'sell'
          ? { kind, project: project.trim() || null, area: area.trim() || null, deal_value_aed: amt, note: note.trim() || null, title: project.trim() || area.trim() || 'Property to sell' }
          : { kind, is_referral: isReferral, project: project.trim() || null, area: area.trim() || null, deal_value_aed: amt, note: note.trim() || null, title: project.trim() || area.trim() || 'Deal to close' };

      const { ref_code } = await submitInquiry(input);
      await openWhatsApp(ref_code, { kind, category, propertyType, beds, area: area.trim(), project: project.trim(), amt, note: note.trim(), isReferral });
      router.back();
    } catch (e) {
      Alert.alert('Could not submit', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function openWhatsApp(inquiryRef: string, d: { kind: InquiryKind; category: PropertyCategory; propertyType: string; beds: number | null; area: string; project: string; amt: number | null; note: string; isReferral: boolean }) {
    const lines = [
      '*New iClose inquiry*',
      `Inquiry ref: ${inquiryRef}`,
      `My ref: ${profile?.ref_code ?? '—'} (${ROLE_LABEL[role]})`,
      '',
    ];
    if (d.kind === 'buy') {
      lines.push('Looking to buy:');
      if (d.propertyType) lines.push(`• Type: ${d.category} · ${d.propertyType}`);
      if (d.beds != null) lines.push(`• Bedrooms: ${d.beds === 0 ? 'Studio' : d.beds}`);
      if (d.area) lines.push(`• Location: ${d.area}`);
      if (d.amt != null) lines.push(`• Budget: ${formatAed(d.amt)}`);
    } else {
      lines.push(d.kind === 'sell' ? 'Property to sell:' : d.isReferral ? 'Deal to refer:' : 'Deal to close:');
      if (d.project) lines.push(`• Property: ${d.project}`);
      if (d.area) lines.push(`• Area: ${d.area}`);
      if (d.amt != null) lines.push(`• ${d.kind === 'sell' ? 'Asking' : 'Deal value'}: ${formatAed(d.amt)}`);
    }
    if (d.note) lines.push(`• Notes: ${d.note}`);
    const url = `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;
    try { await Linking.openURL(url); } catch { /* WhatsApp not installed — the deal is saved regardless */ }
  }

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center justify-between px-4 pb-2">
        <Text className="text-[17px] font-semibold text-ink">{TITLE[kind]}</Text>
        <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-full bg-black/5"><X size={20} color={colors.ink} /></Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        {kind === 'buy' ? (
          <View className="gap-4">
            {/* Category */}
            <Segment label="Property category" options={[...PROPERTY_CATEGORIES]} value={category} onChange={(v) => { setCategory(v as PropertyCategory); setPropertyType(''); }} />
            {/* Property type */}
            <View>
              <Label>Property type</Label>
              <View className="flex-row flex-wrap gap-2">
                {PROPERTY_TYPES[category].map((t) => (
                  <Chip key={t} label={t} active={propertyType === t} onPress={() => setPropertyType(t)} />
                ))}
              </View>
            </View>
            {/* Bedrooms (residential only) */}
            {isResidential ? (
              <View>
                <Label>Bedrooms</Label>
                <View className="flex-row flex-wrap gap-2">
                  {BEDROOMS.map((b) => <Chip key={b} label={b} active={bedrooms === b} onPress={() => setBedrooms(b)} />)}
                </View>
              </View>
            ) : null}
            <Input label="Location" value={area} onChangeText={setArea} placeholder="e.g. Dubai Marina, Downtown…" />
            <Input label="Budget (approx. AED)" value={amount} onChangeText={setAmount} placeholder="e.g. 2,000,000" keyboardType="number-pad" />
            <Input label="Notes" value={note} onChangeText={setNote} placeholder="Any preferences or details" multiline />
          </View>
        ) : (
          <View className="gap-4">
            <Input label="Project / property" value={project} onChangeText={setProject} placeholder={kind === 'sell' ? 'e.g. Marina Gate, Tower 1' : 'e.g. Emaar Beachfront'} />
            <Input label="Area" value={area} onChangeText={setArea} placeholder="e.g. Dubai Marina" />
            <Input label={kind === 'sell' ? 'Asking price (AED)' : 'Deal value (AED)'} value={amount} onChangeText={setAmount} placeholder="e.g. 2,500,000" keyboardType="number-pad" />
            <Input label="Notes" value={note} onChangeText={setNote} placeholder="Anything we should know" multiline />
            {kind === 'close' ? (
              <View className="flex-row items-center justify-between rounded-2xl border border-white/50 bg-white/60 px-4 py-3">
                <View className="flex-1 pr-3">
                  <Text className="text-[14.5px] font-medium text-ink">Refer this deal to iClose</Text>
                  <Text className="text-[12.5px] text-graphite">We close it for you and you earn a referral commission.</Text>
                </View>
                <Switch value={isReferral} onValueChange={setIsReferral} trackColor={{ true: colors.accent }} />
              </View>
            ) : null}
          </View>
        )}

        <Pressable disabled={busy} onPress={submit} className="mt-6 h-[52px] items-center justify-center rounded-full bg-ink">
          {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-[16px] font-semibold text-white">Submit & send on WhatsApp</Text>}
        </Pressable>
        <Text className="mt-3 px-2 text-center text-[12px] text-graphite-light">Saved to your dashboard and shared with our team — with your reference numbers.</Text>
      </ScrollView>
    </View>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <Text className="mb-1.5 text-[13px] font-medium text-graphite">{children}</Text>;
}

function Segment({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View>
      <Label>{label}</Label>
      <View className="flex-row gap-2 rounded-2xl bg-black/5 p-1">
        {options.map((o) => (
          <Pressable key={o} onPress={() => onChange(o)} className={`flex-1 items-center rounded-xl py-2.5 ${value === o ? 'bg-white' : ''}`} style={value === o ? { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 } : undefined}>
            <Text className={`text-[14px] font-semibold ${value === o ? 'text-ink' : 'text-graphite'}`}>{o}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`rounded-full border px-4 py-2.5 ${active ? 'border-accent bg-accent/10' : 'border-white/60 bg-white/60'}`}>
      <Text className={`text-[13.5px] font-semibold ${active ? 'text-accent' : 'text-ink'}`}>{label}</Text>
    </Pressable>
  );
}

function Input({ label, multiline, ...props }: { label: string; multiline?: boolean } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Label>{label}</Label>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.graphiteLight}
        style={multiline ? { minHeight: 80, textAlignVertical: 'top' } : undefined}
        className="rounded-2xl border border-white/50 bg-white/60 px-4 py-3.5 text-base text-ink"
      />
    </View>
  );
}
