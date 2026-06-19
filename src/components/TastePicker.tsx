import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, Check, Heart, ArrowRight, Home, Building2, Compass } from 'lucide-react-native';
import { useExperience } from '@/store/experience';
import { useSignals } from '@/store/signals';
import { facetsOf } from '@/lib/recommender';
import { formatAed } from '@/data/experience-data';
import { colors } from '@/theme/tokens';
import type { ExperienceListing } from '@/types/listing';

const ONBOARDED_KEY = 'iclose.glass.onboarded.v1';

const INTENTS = [
  { id: 'ready', label: 'Move-in ready', sub: 'Buy and live now', Icon: Home, facet: 'completion:ready' },
  { id: 'off_plan', label: 'New launch', sub: 'Off-plan, payment plans', Icon: Building2, facet: 'completion:off_plan' },
  { id: 'explore', label: 'Just exploring', sub: 'Show me everything', Icon: Compass, facet: '' },
] as const;

const BUDGETS = [
  { label: 'Under 1M', band: '<1M' },
  { label: '1 – 2M', band: '1-2M' },
  { label: '2 – 5M', band: '2-5M' },
  { label: '5 – 10M', band: '5-10M' },
  { label: '10M +', band: '10M+' },
] as const;

/** Cold-start taste picker — three taps seed the recommender's affinity. */
export function TastePicker({ onDone }: { onDone?: () => void }) {
  const insets = useSafeAreaInsets();
  const { listings } = useExperience();
  const { seed } = useSignals();

  const [open, setOpen] = useState<boolean | null>(null);
  const [step, setStep] = useState(0);
  const [intent, setIntent] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [loved, setLoved] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY).then((v) => setOpen(!v)).catch(() => setOpen(false));
  }, []);

  const lovePool = useMemo(() => {
    const out: ExperienceListing[] = [];
    const seenC = new Set<string>();
    for (const l of listings) {
      const c = l.community ?? l.city;
      if (!seenC.has(c)) { seenC.add(c); out.push(l); }
      if (out.length >= 8) break;
    }
    for (const l of listings) { if (out.length >= 8) break; if (!out.includes(l)) out.push(l); }
    return out;
  }, [listings]);

  if (!open) return null;

  function finish(skip = false) {
    if (!skip) {
      const facets: Record<string, number> = {};
      const add = (k: string, v: number) => { if (k) facets[k] = (facets[k] ?? 0) + v; };
      const intentFacet = INTENTS.find((i) => i.id === intent)?.facet;
      if (intentFacet) add(intentFacet, 35);
      if (budget) add(`price:${budget}`, 45);
      for (const ref of loved) {
        const l = listings.find((x) => x.reference === ref);
        if (l) for (const f of facetsOf(l)) add(f, 45);
      }
      if (Object.keys(facets).length) seed(facets);
    }
    AsyncStorage.setItem(ONBOARDED_KEY, '1').catch(() => {});
    setOpen(false);
    onDone?.();
  }

  function toggleLove(ref: string) {
    setLoved((prev) => {
      const next = new Set(prev);
      next.has(ref) ? next.delete(ref) : next.add(ref);
      return next;
    });
  }

  const canContinue = step === 0 ? !!intent : step === 1 ? !!budget : true;
  const lastStep = step === 2;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 70 }} className="bg-paper">
      {/* Top bar */}
      <View style={{ paddingTop: insets.top + 12 }} className="flex-row items-center justify-between px-5">
        <View className="flex-row items-center gap-1.5">
          {[0, 1, 2].map((s) => (
            <View key={s} style={{ height: 6, width: s === step ? 24 : 6, borderRadius: 3 }} className={s <= step ? 'bg-ink' : 'bg-hairline'} />
          ))}
        </View>
        <Pressable onPress={() => finish(true)}><Text className="text-sm font-medium text-graphite">Skip</Text></Pressable>
      </View>

      {/* Heading */}
      <View className="px-6 pb-2 pt-6">
        <View className="flex-row items-center gap-1.5 self-start rounded-full bg-accent/10 px-2.5 py-1">
          <Sparkles size={13} color={colors.accent} /><Text className="text-xs font-semibold text-accent">Let's tune your feed</Text>
        </View>
        <Text className="mt-3 text-[26px] font-semibold leading-tight text-ink">
          {step === 0 ? 'What brings you in?' : step === 1 ? "What's your budget?" : 'Tap the homes you love'}
        </Text>
        <Text className="mt-1 text-sm text-graphite">
          {step === 0 ? 'So we show the right kind of homes first.' : step === 1 ? "We'll lead with homes in your range." : 'A few taps teaches your feed your taste.'}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-2" contentContainerStyle={{ paddingBottom: 16 }}>
        {step === 0 ? (
          <View className="gap-3">
            {INTENTS.map(({ id, label, sub, Icon }) => {
              const active = intent === id;
              return (
                <Pressable key={id} onPress={() => setIntent(id)} className={`flex-row items-center gap-4 rounded-3xl border p-4 ${active ? 'border-ink bg-ink' : 'border-hairline bg-paper'}`}>
                  <View className={`h-12 w-12 items-center justify-center rounded-2xl ${active ? 'bg-white/15' : 'bg-mist'}`}><Icon size={24} color={active ? '#fff' : colors.ink} /></View>
                  <View className="flex-1">
                    <Text className={`text-base font-semibold ${active ? 'text-white' : 'text-ink'}`}>{label}</Text>
                    <Text className={`text-[13px] ${active ? 'text-white/70' : 'text-graphite'}`}>{sub}</Text>
                  </View>
                  {active ? <Check size={20} color="#fff" /> : null}
                </Pressable>
              );
            })}
          </View>
        ) : step === 1 ? (
          <View className="flex-row flex-wrap gap-2.5">
            {BUDGETS.map(({ label, band }) => {
              const active = budget === band;
              return (
                <Pressable key={band} onPress={() => setBudget(band)} style={{ width: '47.5%' }} className={`rounded-2xl border py-5 ${active ? 'border-ink bg-ink' : 'border-hairline bg-paper'}`}>
                  <Text className={`text-center text-base font-semibold ${active ? 'text-white' : 'text-ink'}`}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {lovePool.map((l) => {
              const active = loved.has(l.reference);
              return (
                <Pressable key={l.reference} onPress={() => toggleLove(l.reference)} style={{ width: '48%', marginBottom: 12 }} className="overflow-hidden rounded-2xl bg-mist">
                  <View style={{ aspectRatio: 0.8 }}>
                    <Image source={{ uri: l.cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']} style={{ position: 'absolute', width: '100%', height: '100%' }} />
                    <View className={`absolute right-2 top-2 h-9 w-9 items-center justify-center rounded-full ${active ? 'bg-rose-500' : 'bg-white/80'}`}>
                      <Heart size={18} color={active ? '#fff' : colors.ink} fill={active ? '#fff' : 'transparent'} />
                    </View>
                    <View className="absolute inset-x-2 bottom-2">
                      <Text className="text-sm font-semibold text-white">{formatAed(l.priceAed)}</Text>
                      <Text className="text-[11.5px] text-white/80" numberOfLines={1}>{l.community}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + 20 }} className="px-6 pt-2">
        <Pressable
          disabled={!canContinue}
          onPress={() => (lastStep ? finish(false) : setStep((s) => s + 1))}
          style={{ opacity: canContinue ? 1 : 0.4 }}
          className="flex-row items-center justify-center gap-2 rounded-full bg-ink py-4"
        >
          <Text className="text-base font-semibold text-white">{lastStep ? `Show my homes${loved.size ? ` (${loved.size})` : ''}` : 'Continue'}</Text>
          <ArrowRight size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
