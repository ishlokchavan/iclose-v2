import { useMemo, useRef, useState } from 'react';
import { View, Text, Platform, Pressable, ScrollView, Dimensions, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { useExperience } from '@/store/experience';
import { formatAed } from '@/data/experience-data';
import { colors } from '@/theme/tokens';
import type { ExperienceListing } from '@/types/listing';

const { width } = Dimensions.get('window');
const CARD_W = width * 0.7;

/**
 * react-native-maps is a custom native module (absent in Expo Go). Load it
 * defensively so the Map tab degrades to a list instead of crashing.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Maps: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Maps = require('react-native-maps');
} catch {
  Maps = null;
}
const HAS_MAP = Boolean(Maps?.default);
const DUBAI = { latitude: 25.13, longitude: 55.22, latitudeDelta: 0.35, longitudeDelta: 0.35 };

const CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'buy', label: 'Buy' },
  { key: 'offplan', label: 'Off-Plan' },
  { key: 'releases', label: 'New Releases' },
] as const;
type ChipKey = (typeof CHIPS)[number]['key'];

function pricePin(n: number): string {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : `${Math.round(n / 1000)}K`;
}

export default function MapScreen() {
  const { listings } = useExperience();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<any>(null);
  const cardsRef = useRef<FlatList<ExperienceListing>>(null);
  const [chip, setChip] = useState<ChipKey>('all');
  const [active, setActive] = useState<string | null>(null);

  const visible = useMemo(() => {
    let out = listings.filter((l) => l.latitude != null && l.longitude != null);
    if (chip === 'buy') out = out.filter((l) => l.purpose === 'sale' && l.completion === 'ready');
    else if (chip === 'offplan') out = out.filter((l) => l.completion === 'off_plan');
    else if (chip === 'releases') out = out.filter((l) => l.completion === 'off_plan' && l.source === 'developer');
    return out;
  }, [listings, chip]);

  function focus(l: ExperienceListing, i: number) {
    setActive(l.reference);
    mapRef.current?.animateToRegion(
      { latitude: l.latitude as number, longitude: l.longitude as number, latitudeDelta: 0.06, longitudeDelta: 0.06 },
      350,
    );
    cardsRef.current?.scrollToIndex({ index: i, animated: true, viewPosition: 0.5 });
  }

  const ChipBar = (
    <View style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
        {CHIPS.map((c) => (
          <Pressable key={c.key} onPress={() => setChip(c.key)} className={`rounded-full px-4 py-1.5 ${chip === c.key ? 'bg-ink' : 'bg-white'}`}
            style={{ borderWidth: chip === c.key ? 0 : 1, borderColor: 'rgba(0,0,0,0.08)' }}>
            <Text className={`text-[13px] font-medium ${chip === c.key ? 'text-white' : 'text-graphite'}`}>{c.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  // ── Fallback (no native maps, e.g. Expo Go): a useful list of pinned homes ──
  if (!HAS_MAP) {
    return (
      <View className="flex-1 bg-mist" style={{ paddingTop: insets.top + 52 }}>
        {ChipBar}
        <FlatList
          data={visible}
          keyExtractor={(l) => l.reference}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 12, paddingBottom: insets.bottom + 110 }}
          ListHeaderComponent={
            <View className="px-1 pb-2">
              <View className="flex-row items-center gap-1.5 rounded-2xl bg-paper px-3 py-2">
                <MapPin size={14} color={colors.graphite} />
                <Text className="flex-1 text-xs text-graphite">{visible.length} homes · live map needs a development build</Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/property/${item.reference}`)} className="flex-1 overflow-hidden rounded-2xl border border-hairline/60 bg-paper">
              <Image source={{ uri: item.cover }} style={{ width: '100%', aspectRatio: 1 }} contentFit="cover" />
              <View className="p-2.5">
                <Text className="text-[15px] font-semibold text-ink">{formatAed(item.priceAed)}</Text>
                <Text className="mt-1 text-xs text-graphite" numberOfLines={1}>{item.community}, {item.city}</Text>
              </View>
            </Pressable>
          )}
        />
      </View>
    );
  }

  const MapView = Maps.default;
  const { Marker, PROVIDER_GOOGLE } = Maps;

  return (
    <View className="flex-1 bg-mist">
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={{ flex: 1 }}
        initialRegion={DUBAI}
      >
        {visible.map((l, i) => {
          const sel = active === l.reference;
          return (
            <Marker key={l.reference} coordinate={{ latitude: l.latitude as number, longitude: l.longitude as number }} onPress={() => focus(l, i)} zIndex={sel ? 10 : 1}>
              <View className={`rounded-full px-2.5 py-1 ${sel ? 'bg-ink' : 'bg-white'}`} style={{ borderWidth: sel ? 0 : 1, borderColor: 'rgba(0,0,0,0.1)' }}>
                <Text className={`text-[11px] font-semibold ${sel ? 'text-white' : 'text-ink'}`}>{pricePin(l.priceAed)}</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {ChipBar}

      <FlatList
        ref={cardsRef}
        data={visible}
        keyExtractor={(l) => l.reference}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + 12}
        decelerationRate="fast"
        style={{ position: 'absolute', bottom: insets.bottom + 96, left: 0, right: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/property/${item.reference}`)} style={{ width: CARD_W }} className="flex-row gap-3 rounded-apple bg-paper p-3">
            <Image source={{ uri: item.cover }} style={{ height: 68, width: 68, borderRadius: 12 }} contentFit="cover" />
            <View className="flex-1 justify-between py-0.5">
              <View>
                <Text className="text-sm font-semibold text-ink" numberOfLines={1}>{item.title}</Text>
                <Text className="text-xs text-graphite" numberOfLines={1}>{item.community ?? item.city}</Text>
              </View>
              <Text className="text-[15px] font-bold text-ink">{formatAed(item.priceAed)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
