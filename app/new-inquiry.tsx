import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, Linking } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Building2, Store, KeyRound, HardHat, Home, Hotel, Warehouse, Wallet, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import {
  submitInquiry, brokerPocket, buyerBenefit, PROPERTY_TYPES, ROLE_LABEL,
  type NewInquiry, type InquiryKind, type PropertyCategory, type DealType,
} from '@/lib/deals';
import type { Emirate } from '@/data/locations';
import { CONTACT_WHATSAPP } from '@/lib/config';
import { GlassBg } from '@/components/Glass';
import { LocationPicker } from '@/components/LocationPicker';
import { AmountField } from '@/components/AmountField';
import { formatAed } from '@/lib/format';
import { colors } from '@/theme/tokens';

const KIND_FOR_ROLE = { buyer: 'buy', seller: 'sell', broker: 'close' } as const;
const TITLE: Record<InquiryKind, string> = { buy: 'New buying inquiry', sell: 'List your property', close: 'New deal inquiry' };
const BEDROOMS = ['Studio', '1', '2', '3', '4', '5+'];
const TYPE_ICON: Record<string, typeof Home> = { Apartment: Building2, Villa: Home, Townhouse: Hotel, Penthouse: Building2, 'Office Space': Store, Retail: Store, Land: Warehouse };

export default function NewInquiryScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const role = profile?.role ?? 'buyer';
  const kind: InquiryKind = KIND_FOR_ROLE[role];

  const [dealType, setDealType] = useState<DealType>('secondary');
  const [category, setCategory] = useState<PropertyCategory>('Residential');
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [project, setProject] = useState('');
  const [emirate, setEmirate] = useState<Emirate>('Dubai');
  const [area, setArea] = useState('');
  const [amount, setAmount] = useState(''); // raw digits
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const isResidential = category === 'Residential';
  const amt = amount ? Number(amount) : 0;

  async function submit() {
    if (!area.trim()) return Alert.alert('Add a location', 'Please pick where.');
    if (kind !== 'buy' && !project.trim()) return Alert.alert('Add the property', 'Tell us the project or property.');
    setBusy(true);
    try {
      const beds = kind === 'buy' && isResidential && bedrooms ? (bedrooms === 'Studio' ? 0 : parseInt(bedrooms, 10)) : null;
      const typeLabel = kind === 'buy' && propertyType ? `${category} · ${propertyType}` : null;
      const input: NewInquiry =
        kind === 'buy'
          ? { kind, deal_type: dealType, emirate, area, property_type: typeLabel, bedrooms: beds, budget_aed: amt || null, note: note.trim() || null, title: [propertyType, area].filter(Boolean).join(' in ') || 'Buying inquiry' }
          : kind === 'sell'
          ? { kind, deal_type: dealType, emirate, area, project: project.trim(), deal_value_aed: amt || null, note: note.trim() || null, title: project.trim() || area || 'Property to sell' }
          : { kind, deal_type: dealType, emirate, area, project: project.trim(), deal_value_aed: amt || null, note: note.trim() || null, title: project.trim() || area || 'Deal to close' };
      const { ref_code } = await submitInquiry(input);
      await openWhatsApp(ref_code);
      router.back();
    } catch (e) {
      Alert.alert('Could not submit', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function openWhatsApp(inquiryRef: string) {
    const L = [`*New iClose inquiry*`, `Inquiry ref: ${inquiryRef}`, `My ref: ${profile?.ref_code ?? '—'} (${ROLE_LABEL[role]})`, ''];
    L.push(kind === 'buy' ? 'Looking to buy:' : kind === 'sell' ? 'Property to sell:' : 'Deal to close:');
    L.push(`• Type: ${dealType === 'offplan' ? 'Off-plan' : 'Ready / Secondary'}`);
    if (kind === 'buy' && propertyType) L.push(`• Property: ${category} · ${propertyType}`);
    if (project.trim()) L.push(`• Property: ${project.trim()}`);
    if (kind === 'buy' && isResidential && bedrooms) L.push(`• Bedrooms: ${bedrooms}`);
    L.push(`• Location: ${emirate} · ${area}`);
    if (amt) L.push(`• ${kind === 'buy' ? 'Budget' : kind === 'sell' ? 'Asking' : 'Deal value'}: ${formatAed(amt)}`);
    if (note.trim()) L.push(`• Notes: ${note.trim()}`);
    try { await Linking.openURL(`https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(L.join('\n'))}`); } catch { /* saved regardless */ }
  }

  const pocket = amt ? brokerPocket(dealType, amt) : null;
  const benefit = amt ? buyerBenefit(dealType, amt) : null;

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center justify-between px-4 pb-2">
        <Text className="text-[17px] font-semibold text-ink">{TITLE[kind]}</Text>
        <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-full bg-surface2"><X size={20} color={colors.ink} /></Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <View className="gap-4">
          <View>
            <Label>Property status</Label>
            <View className="flex-row gap-2">
              <IconSeg icon={KeyRound} label="Ready / Secondary" active={dealType === 'secondary'} onPress={() => setDealType('secondary')} />
              <IconSeg icon={HardHat} label="Off-plan" active={dealType === 'offplan'} onPress={() => setDealType('offplan')} />
            </View>
          </View>

          {kind === 'buy' ? (
            <>
              <View>
                <Label>Category</Label>
                <View className="flex-row gap-2">
                  <IconSeg icon={Building2} label="Residential" active={category === 'Residential'} onPress={() => { setCategory('Residential'); setPropertyType(''); }} />
                  <IconSeg icon={Store} label="Commercial" active={category === 'Commercial'} onPress={() => { setCategory('Commercial'); setPropertyType(''); setBedrooms(''); }} />
                </View>
              </View>
              <View>
                <Label>Property type</Label>
                <View className="flex-row flex-wrap gap-2">
                  {PROPERTY_TYPES[category].map((t) => {
                    const Icon = TYPE_ICON[t] ?? Building2;
                    const active = propertyType === t;
                    return (
                      <Pressable key={t} onPress={() => setPropertyType(t)} className={`flex-row items-center gap-1.5 rounded-full border px-3.5 py-2.5 ${active ? 'border-accent bg-accent' : 'border-hairline bg-surface2'}`}>
                        <Icon size={15} color={active ? colors.onAccent : colors.graphite} /><Text className={`text-[13.5px] font-semibold ${active ? '' : 'text-ink'}`} style={active ? { color: colors.onAccent } : undefined}>{t}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              {isResidential ? (
                <View>
                  <Label>Bedrooms</Label>
                  <View className="flex-row flex-wrap gap-2">{BEDROOMS.map((b) => <Chip key={b} label={b} active={bedrooms === b} onPress={() => setBedrooms(b)} />)}</View>
                </View>
              ) : null}
              <View><Label>Location</Label><LocationPicker emirate={emirate} area={area} onChange={(e, a) => { setEmirate(e); setArea(a); }} /></View>
              <AmountField label="Budget (approx.)" value={amount} onChange={setAmount} />
            </>
          ) : (
            <>
              <Input label="Project / property" value={project} onChangeText={setProject} placeholder={kind === 'sell' ? 'e.g. Marina Gate, Tower 1' : 'e.g. Emaar Beachfront'} />
              <View><Label>Location</Label><LocationPicker emirate={emirate} area={area} onChange={(e, a) => { setEmirate(e); setArea(a); }} /></View>
              <AmountField label={kind === 'sell' ? 'Asking price' : 'Deal value'} value={amount} onChange={setAmount} />
            </>
          )}

          {/* Live net calculator */}
          {kind === 'close' && pocket ? (
            <CalcCard icon={Wallet} label={`You keep (${pocket.pct}% ${dealType === 'offplan' ? 'off-plan' : 'secondary'})`} net={pocket.net} breakdown={`${formatAed(pocket.gross)} commission − ${formatAed(pocket.fee)} admin fee`} />
          ) : null}
          {kind === 'buy' && benefit ? (
            <CalcCard icon={TrendingUp} label={benefit.label} net={benefit.net} breakdown={`${formatAed(benefit.gross)} ${dealType === 'secondary' ? 'commission avoided' : 'credit'} − ${formatAed(benefit.fee)} fee`} />
          ) : null}

          <Input label="Notes" value={note} onChangeText={setNote} placeholder="Anything we should know" multiline />
        </View>

        <Pressable disabled={busy} onPress={submit} className="mt-6 h-[52px] items-center justify-center rounded-full bg-accent">
          {busy ? <ActivityIndicator color={colors.onAccent} /> : <Text className="text-[16px] font-semibold" style={{ color: colors.onAccent }}>Submit & send on WhatsApp</Text>}
        </Pressable>
        <Text className="mt-3 px-2 text-center text-[12px] text-graphite-light">Saved to your inquiries and shared with our team — with your reference numbers.</Text>
      </ScrollView>
    </View>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <Text className="mb-1.5 text-[13px] font-medium text-graphite">{children}</Text>;
}
function IconSeg({ icon: Icon, label, active, onPress }: { icon: typeof Home; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`flex-1 flex-row items-center justify-center gap-2 rounded-2xl border py-3.5 ${active ? 'border-accent bg-accent' : 'border-hairline bg-surface2'}`}>
      <Icon size={17} color={active ? colors.onAccent : colors.graphite} />
      <Text className={`text-[13.5px] font-semibold ${active ? '' : 'text-ink'}`} style={active ? { color: colors.onAccent } : undefined}>{label}</Text>
    </Pressable>
  );
}
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`rounded-full border px-4 py-2.5 ${active ? 'border-accent bg-accent' : 'border-hairline bg-surface2'}`}>
      <Text className={`text-[13.5px] font-semibold ${active ? '' : 'text-ink'}`} style={active ? { color: colors.onAccent } : undefined}>{label}</Text>
    </Pressable>
  );
}
function CalcCard({ icon: Icon, label, net, breakdown }: { icon: typeof Home; label: string; net: number; breakdown: string }) {
  return (
    <View className="overflow-hidden rounded-apple border border-hairline bg-surface">
      <LinearGradient colors={['rgba(158,255,0,0.14)', 'rgba(158,255,0,0.04)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16 }}>
        <View className="flex-row items-center gap-2"><Icon size={16} color={colors.accent} /><Text className="text-[12.5px] font-medium text-graphite">{label}</Text></View>
        <Text className="mt-1 text-[27px] font-bold" style={{ color: colors.accent }}>{formatAed(net)}</Text>
        <Text className="mt-0.5 text-[12px] text-graphite">{breakdown}</Text>
      </LinearGradient>
    </View>
  );
}
function Input({ label, multiline, ...props }: { label: string; multiline?: boolean } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Label>{label}</Label>
      <TextInput {...props} multiline={multiline} placeholderTextColor={colors.graphiteLight} style={multiline ? { minHeight: 80, textAlignVertical: 'top' } : undefined} className="rounded-2xl border border-hairline bg-surface px-4 py-3.5 text-base text-ink" />
    </View>
  );
}
