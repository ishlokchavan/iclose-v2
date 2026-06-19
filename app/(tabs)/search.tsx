import { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search as SearchIcon, X } from 'lucide-react-native';
import { useExperience } from '@/store/experience';
import { api, type SearchFilters } from '@/lib/api';
import { aed } from '@/lib/format';
import { colors } from '@/theme/tokens';
import type { ExperienceListing } from '@/types/listing';

const CHIPS = ['Off-plan', 'Ready', 'Villa', 'Penthouse', 'Marina', 'Downtown'];

/** Text match across a listing's main fields. */
function matchesText(l: ExperienceListing, t: string): boolean {
  if (!t) return true;
  return [l.title, l.community, l.developerName, l.propertyType, l.completion]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(t));
}

/** Apply structured NL filters returned by /api/glass/search-parse. */
function matchesFilters(l: ExperienceListing, f: SearchFilters): boolean {
  if (f.completion && l.completion !== f.completion) return false;
  if (f.propertyType && l.propertyType !== f.propertyType) return false;
  if (f.community && !String(l.community ?? '').toLowerCase().includes(f.community.toLowerCase())) return false;
  if (f.minPrice != null && l.priceAed < f.minPrice) return false;
  if (f.maxPrice != null && l.priceAed > f.maxPrice) return false;
  if (f.bedrooms != null && (l.bedrooms ?? -1) < f.bedrooms) return false;
  if (f.query && !matchesText(l, f.query.toLowerCase())) return false;
  return true;
}

/** Search — instant client filtering, upgraded by NL parsing on submit. */
export default function SearchScreen() {
  const { listings } = useExperience();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<SearchFilters | null>(null);
  const [parsing, setParsing] = useState(false);

  const results = useMemo(() => {
    if (filters) return listings.filter((l) => matchesFilters(l, filters));
    return listings.filter((l) => matchesText(l, q.trim().toLowerCase()));
  }, [q, filters, listings]);

  function reset(text = '') {
    setQ(text);
    setFilters(null);
  }

  async function runNlSearch() {
    const query = q.trim();
    if (!query) return reset();
    setParsing(true);
    try {
      const { filters: parsed } = await api.searchParse(query);
      // Keep the raw query in the filter set so text terms still apply.
      setFilters({ query, ...parsed });
    } catch {
      setFilters(null); // fall back to instant text filtering
    } finally {
      setParsing(false);
    }
  }

  return (
    <View className="flex-1 bg-fog" style={{ paddingTop: insets.top }}>
      <View className="px-5 pb-2 pt-2">
        <Text className="mb-3 text-2xl font-bold text-ink">Search</Text>
        <View className="flex-row items-center gap-2 rounded-apple bg-paper px-4 py-3">
          <SearchIcon size={18} color={colors.graphite} />
          <TextInput
            value={q}
            onChangeText={(t) => { setQ(t); setFilters(null); }}
            onSubmitEditing={runNlSearch}
            returnKeyType="search"
            placeholder="Try “off-plan villa in the Marina”"
            placeholderTextColor={colors.graphiteLight}
            className="flex-1 text-base text-ink"
          />
          {parsing ? <ActivityIndicator size="small" color={colors.accent} /> : null}
          {q ? (
            <Pressable onPress={() => reset()} hitSlop={8}>
              <X size={18} color={colors.graphite} />
            </Pressable>
          ) : null}
        </View>

        {filters ? (
          <Text className="mt-2 text-xs text-graphite">
            Smart filters applied · {results.length} {results.length === 1 ? 'home' : 'homes'}
          </Text>
        ) : null}

        <FlatList
          horizontal
          data={CHIPS}
          keyExtractor={(c) => c}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => reset(item)} className="rounded-full border border-hairline bg-paper px-4 py-2">
              <Text className="text-sm font-medium text-ink">{item}</Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(l) => l.reference}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 110, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/property/${item.reference}`)} className="flex-row gap-3 rounded-apple bg-paper p-3">
            <Image source={{ uri: item.cover }} style={{ width: 80, height: 80, borderRadius: 12 }} contentFit="cover" />
            <View className="flex-1 justify-center">
              <Text className="text-base font-semibold text-ink" numberOfLines={1}>{item.title}</Text>
              <Text className="text-sm text-graphite">{item.community}</Text>
              <Text className="mt-1 font-bold text-ink">{aed(item.priceAed)}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<Text className="mt-10 text-center text-graphite">No matches — try another term.</Text>}
      />
    </View>
  );
}
