import { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search as SearchIcon } from 'lucide-react-native';
import { useExperience } from '@/store/experience';
import { aed } from '@/lib/format';
import { colors } from '@/theme/tokens';

const CHIPS = ['Off-plan', 'Ready', 'Villa', 'Penthouse', 'Marina', 'Downtown'];

/** Search — instant client-side filtering of the feed (NL parse via API is wired in api.searchParse). */
export default function SearchScreen() {
  const { listings } = useExperience();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return listings;
    return listings.filter((l) =>
      [l.title, l.community, l.developerName, l.propertyType, l.completion]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t)),
    );
  }, [q, listings]);

  return (
    <View className="flex-1 bg-fog" style={{ paddingTop: insets.top }}>
      <View className="px-5 pb-2 pt-2">
        <Text className="mb-3 text-2xl font-bold text-ink">Search</Text>
        <View className="flex-row items-center gap-2 rounded-apple bg-paper px-4 py-3">
          <SearchIcon size={18} color={colors.graphite} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Try “off-plan villa in the Marina”"
            placeholderTextColor={colors.graphiteLight}
            className="flex-1 text-base text-ink"
          />
        </View>
        <FlatList
          horizontal
          data={CHIPS}
          keyExtractor={(c) => c}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => setQ(item)} className="rounded-full border border-hairline bg-paper px-4 py-2">
              <Text className="text-sm font-medium text-ink">{item}</Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(l) => l.reference}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 110, gap: 12 }}
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
