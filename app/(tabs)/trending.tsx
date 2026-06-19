import { View, Text, FlatList, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { TrendingUp, Sparkles } from 'lucide-react-native';
import { useExperience } from '@/store/experience';
import { CreditBadge } from '@/components/CreditBadge';
import { aed } from '@/lib/format';
import { colors } from '@/theme/tokens';

/** Trending — ranked by credit value back (highest reward first). */
export default function TrendingScreen() {
  const { listings } = useExperience();
  const insets = useSafeAreaInsets();
  const ranked = [...listings].sort((a, b) => b.credit.credits - a.credit.credits);

  return (
    <View className="flex-1 bg-fog" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
        <View className="flex-row items-center gap-2">
          <TrendingUp size={22} color={colors.ink} />
          <Text className="text-2xl font-bold text-ink">Trending</Text>
        </View>
        <Pressable
          onPress={() => router.push('/launches')}
          className="flex-row items-center gap-1.5 rounded-full bg-ink px-3.5 py-2"
        >
          <Sparkles size={15} color="#fff" />
          <Text className="text-sm font-semibold text-white">New launches</Text>
        </Pressable>
      </View>
      <FlatList
        data={ranked}
        keyExtractor={(l) => l.reference}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 110, gap: 14 }}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => router.push(`/property/${item.reference}`)}
            className="flex-row gap-3 rounded-apple bg-paper p-3"
            style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}
          >
            <Image source={{ uri: item.cover }} style={{ width: 96, height: 96, borderRadius: 14 }} contentFit="cover" />
            <View className="flex-1 justify-between py-1">
              <Text className="text-base font-semibold text-ink" numberOfLines={2}>{item.title}</Text>
              <Text className="text-sm text-graphite">{item.community}</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-bold text-ink">{aed(item.priceAed)}</Text>
                <CreditBadge award={item.credit} />
              </View>
            </View>
            <View className="absolute -left-1 -top-1 h-7 w-7 items-center justify-center rounded-full bg-ink">
              <Text className="text-xs font-bold text-white">{index + 1}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
