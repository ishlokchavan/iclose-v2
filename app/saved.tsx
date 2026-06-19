import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Heart, MapPin, BedDouble, Maximize, Trash2, Coins } from 'lucide-react-native';
import { useExperience } from '@/store/experience';
import { useSaved } from '@/store/saved';
import { usePullRefresh } from '@/lib/use-refresh';
import { formatAed, formatCredits } from '@/data/experience-data';
import { bedLabel } from '@/lib/format';
import { colors } from '@/theme/tokens';

/** Saved — the shortlist with total credits, mirrors the web SavedDeck. */
export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { listings } = useExperience();
  const { decisions, toggle } = useSaved();
  const { refreshing, onRefresh } = usePullRefresh();
  const saved = listings.filter((l) => decisions[l.reference] === 'saved');
  const totalCredits = saved.reduce((s, l) => s + l.credit.credits, 0);

  return (
    <View className="flex-1 bg-mist" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center justify-between px-4 pb-1">
        <View>
          <Text className="text-[30px] font-semibold text-ink">Saved</Text>
          <Text className="mt-0.5 text-sm text-graphite">
            {saved.length === 0 ? 'Homes you save will stack up here' : `${saved.length} ${saved.length === 1 ? 'home' : 'homes'} saved`}
          </Text>
        </View>
        <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-full bg-paper"><X size={20} color={colors.ink} /></Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {saved.length ? (
          <View className="mb-4 flex-row items-center justify-between rounded-apple bg-ink px-5 py-4">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10"><Coins size={20} color={colors.journey.offplan} /></View>
              <View>
                <Text className="text-xs text-white/60">Credits across your shortlist</Text>
                <Text className="text-[22px] font-semibold text-white">{formatCredits(totalCredits)}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {saved.length === 0 ? (
          <View className="mt-2 items-center gap-4 rounded-apple bg-paper px-6 py-14">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-accent/10"><Heart size={28} color={colors.accent} /></View>
            <Text className="text-[17px] font-semibold text-ink">No saved homes yet</Text>
            <Text className="max-w-[240px] text-center text-sm text-graphite">Tap the heart on a home you love and it'll appear here — along with the credits you'd earn.</Text>
            <Pressable onPress={() => router.back()} className="mt-1 rounded-full bg-ink px-6 py-3"><Text className="text-[15px] font-semibold text-white">Start discovering</Text></Pressable>
          </View>
        ) : (
          <View className="gap-3">
            {saved.map((l) => (
              <View key={l.reference} className="overflow-hidden rounded-apple bg-paper">
                <Pressable onPress={() => router.push(`/property/${l.reference}`)} className="flex-row gap-3 p-3">
                  <Image source={{ uri: l.cover }} style={{ height: 122, width: 112, borderRadius: 16 }} contentFit="cover" />
                  <View className="flex-1 py-1">
                    <Text className="text-[19px] font-semibold text-ink">{formatAed(l.priceAed)}</Text>
                    <View className="mt-1.5 flex-row items-center gap-1 self-start rounded-full bg-accent/10 px-2 py-0.5">
                      <Coins size={12} color={colors.accent} /><Text className="text-xs font-semibold text-accent">{formatCredits(l.credit.credits)} credits</Text>
                    </View>
                    <Text className="mt-1.5 text-sm font-medium text-ink" numberOfLines={1}>{l.title}</Text>
                    <View className="mt-0.5 flex-row items-center gap-1"><MapPin size={12} color={colors.graphite} /><Text className="text-xs text-graphite">{l.community}, {l.city}</Text></View>
                    <View className="mt-1.5 flex-row gap-3">
                      {l.bedrooms !== null ? <View className="flex-row items-center gap-1"><BedDouble size={14} color={colors.graphiteDark} /><Text className="text-xs text-graphite">{bedLabel(l.bedrooms)}</Text></View> : null}
                      {l.areaSqft !== null ? <View className="flex-row items-center gap-1"><Maximize size={14} color={colors.graphiteDark} /><Text className="text-xs text-graphite">{l.areaSqft.toLocaleString()} sqft</Text></View> : null}
                    </View>
                  </View>
                </Pressable>
                <Pressable onPress={() => toggle(l.reference)} className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-mist"><Trash2 size={16} color={colors.graphiteDark} /></Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
