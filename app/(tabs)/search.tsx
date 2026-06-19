import { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search as SearchIcon, X, Sparkles, Heart, Coins } from 'lucide-react-native';
import { useExperience } from '@/store/experience';
import { useSaved } from '@/store/saved';
import { parseSearch, type ParsedFilters } from '@/lib/search-parse';
import { formatAed, formatCredits } from '@/data/experience-data';
import { colors } from '@/theme/tokens';
import type { ExperienceListing } from '@/types/listing';

const EXAMPLE = '2-bed near the marina under 2M with a pool';
const BED_CHIPS = ['Studio', '1', '2', '3', '4+'];

/** Search — instant substring filtering, upgraded by natural-language parsing. */
export default function SearchScreen() {
  const { listings } = useExperience();
  const { isSaved, toggle } = useSaved();
  const insets = useSafeAreaInsets();

  const [q, setQ] = useState('');
  const [completion, setCompletion] = useState<'' | 'ready' | 'off_plan'>('');
  const [beds, setBeds] = useState('');
  const [smart, setSmart] = useState<ParsedFilters | null>(null);

  const communityOptions = useMemo(
    () => Array.from(new Set(listings.map((l) => l.community).filter(Boolean))) as string[],
    [listings],
  );

  function runSmart(text: string) {
    const query = text.trim();
    if (!query) return;
    const f = parseSearch(query, communityOptions);
    setSmart(f);
    setCompletion(f.completion ?? '');
    setBeds('');
  }

  function clearAll() {
    setSmart(null);
    setQ('');
    setCompletion('');
    setBeds('');
  }

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    const f = smart;
    return listings.filter((l) => {
      if (!f && query) {
        const hay = [l.title, l.community, l.building, l.city, l.developerName].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(query)) return false;
      }
      if (f?.community && !(l.community ?? '').toLowerCase().includes(f.community.toLowerCase())) return false;
      if (completion && l.completion !== completion) return false;
      if (beds) {
        if (beds === 'Studio' && l.bedrooms !== 0) return false;
        else if (beds === '4+' && (l.bedrooms ?? 0) < 4) return false;
        else if (!['Studio', '4+'].includes(beds) && l.bedrooms !== Number(beds)) return false;
      }
      if (f?.minBeds != null && (l.bedrooms ?? -1) < f.minBeds) return false;
      if (f?.maxBeds != null && (l.bedrooms ?? 99) > f.maxBeds) return false;
      if (f?.types.length && !f.types.includes(l.propertyType)) return false;
      if (f?.minPrice && l.priceAed < f.minPrice) return false;
      if (f?.maxPrice && l.priceAed > f.maxPrice) return false;
      if (f?.amenities.length) {
        const hay = [...(l.amenities ?? []), l.title, l.community ?? ''].join(' ').toLowerCase();
        if (!f.amenities.every((a) => hay.includes(a))) return false;
      }
      return true;
    });
  }, [listings, q, smart, completion, beds]);

  const smartChips: string[] = [];
  if (smart) {
    if (smart.community) smartChips.push(smart.community);
    if (smart.completion) smartChips.push(smart.completion === 'off_plan' ? 'Off-plan' : 'Ready');
    if (smart.minBeds === 0 && smart.maxBeds === 0) smartChips.push('Studio');
    else if (smart.minBeds != null) smartChips.push(`${smart.minBeds}+ beds`);
    smart.types.forEach((t) => smartChips.push(t));
    if (smart.maxPrice) smartChips.push(`≤ ${formatAed(smart.maxPrice)}`);
    if (smart.minPrice) smartChips.push(`≥ ${formatAed(smart.minPrice)}`);
    smart.amenities.forEach((a) => smartChips.push(a));
  }

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }}>
      <View className="px-4 pb-2 pt-2">
        <Text className="mb-3 text-2xl font-bold text-ink">Search</Text>
        <View className="flex-row items-center gap-2 rounded-full bg-mist px-4 py-3">
          {smart ? <Sparkles size={18} color={colors.accent} /> : <SearchIcon size={18} color={colors.graphite} />}
          <TextInput
            value={q}
            onChangeText={(t) => { setQ(t); if (smart) setSmart(null); }}
            onSubmitEditing={() => runSmart(q)}
            returnKeyType="search"
            placeholder="Describe your ideal home…"
            placeholderTextColor={colors.graphiteLight}
            className="flex-1 text-base text-ink"
          />
          {q ? <Pressable onPress={clearAll} hitSlop={8}><X size={18} color={colors.graphite} /></Pressable> : null}
        </View>

        {/* Quick chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 10 }}>
          {(['', 'ready', 'off_plan'] as const).map((c) => (
            <Chip key={c || 'all'} active={completion === c} onPress={() => setCompletion(c)}>
              {c === '' ? 'All' : c === 'ready' ? 'Ready' : 'Off-plan'}
            </Chip>
          ))}
          {BED_CHIPS.map((b) => (
            <Chip key={b} active={beds === b} onPress={() => setBeds(beds === b ? '' : b)}>
              {b === 'Studio' ? b : `${b} bed`}
            </Chip>
          ))}
        </ScrollView>

        {smart ? (
          <View className="mb-1 rounded-2xl border border-accent/20 bg-accent/5 px-3.5 py-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5"><Sparkles size={13} color={colors.accent} /><Text className="text-xs font-semibold text-accent">Understood</Text></View>
              <Pressable onPress={clearAll} className="flex-row items-center gap-1"><Text className="text-xs text-graphite">Clear</Text><X size={13} color={colors.graphite} /></Pressable>
            </View>
            {smartChips.length ? (
              <View className="mt-2 flex-row flex-wrap gap-1.5">
                {smartChips.map((c, i) => (
                  <View key={i} className="rounded-full bg-paper px-2.5 py-1"><Text className="text-xs font-medium capitalize text-ink">{c}</Text></View>
                ))}
              </View>
            ) : <Text className="mt-1 text-xs text-graphite">Showing the closest matches.</Text>}
          </View>
        ) : !q ? (
          <Pressable onPress={() => { setQ(EXAMPLE); runSmart(EXAMPLE); }} className="mb-1 flex-row items-center gap-2 rounded-2xl border border-accent/20 bg-accent/5 px-3.5 py-2.5">
            <Sparkles size={15} color={colors.accent} /><Text className="text-[13px] text-graphite">Try: <Text className="text-ink">“{EXAMPLE}”</Text></Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={results}
        keyExtractor={(l) => l.reference}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ gap: 12, paddingBottom: insets.bottom + 110, paddingTop: 4 }}
        ListHeaderComponent={<Text className="px-4 pb-1 text-[13px] text-graphite">{results.length} {results.length === 1 ? 'home' : 'homes'}</Text>}
        renderItem={({ item }) => (
          <GridCard listing={item} saved={isSaved(item.reference)} onToggle={() => toggle(item.reference)} />
        )}
        ListEmptyComponent={<Text className="mt-16 text-center text-graphite">No homes match. Try clearing a filter.</Text>}
      />
    </View>
  );
}

function GridCard({ listing, saved, onToggle }: { listing: ExperienceListing; saved: boolean; onToggle: () => void }) {
  return (
    <View className="flex-1 overflow-hidden rounded-2xl border border-hairline/60">
      <Pressable onPress={() => router.push(`/property/${listing.reference}`)}>
        <View className="relative">
          <Image source={{ uri: listing.cover }} style={{ width: '100%', height: 150 }} contentFit="cover" />
          <Pressable onPress={onToggle} hitSlop={8} className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-white/80">
            <Heart size={16} color={saved ? '#f43f5e' : colors.ink} fill={saved ? '#f43f5e' : 'transparent'} />
          </Pressable>
        </View>
        <View className="p-2.5">
          <Text className="text-[15px] font-semibold text-ink">{formatAed(listing.priceAed)}</Text>
          <View className="mt-1.5 flex-row items-center gap-1 self-start rounded-full bg-accent/10 px-1.5 py-0.5">
            <Coins size={11} color={colors.accent} /><Text className="text-[11px] font-semibold text-accent">{formatCredits(listing.credit.credits)}</Text>
          </View>
          <Text className="mt-1 text-xs text-graphite" numberOfLines={1}>{listing.community}, {listing.city}</Text>
        </View>
      </Pressable>
    </View>
  );
}

function Chip({ active, onPress, children }: { active: boolean; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} className={`rounded-full px-3.5 py-1.5 ${active ? 'bg-ink' : 'bg-mist'}`}>
      <Text className={`text-[13px] font-medium ${active ? 'text-white' : 'text-graphite'}`}>{children}</Text>
    </Pressable>
  );
}
