import { View, Text, FlatList, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { X, Heart, HeartOff } from 'lucide-react-native';
import { useExperience } from '@/store/experience';
import { useSaved } from '@/store/saved';
import { CreditBadge } from '@/components/CreditBadge';
import { aed } from '@/lib/format';
import { colors } from '@/theme/tokens';

/** Saved homes (modal) — the listings the user has hearted. */
export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { listings } = useExperience();
  const { saved, toggle } = useSaved();
  const items = listings.filter((l) => saved.has(l.reference));

  return (
    <View className="flex-1 bg-fog" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center justify-between px-5 pb-2">
        <Text className="text-2xl font-bold text-ink">Saved homes</Text>
        <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-full bg-mist">
          <X size={20} color={colors.ink} />
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(l) => l.reference}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/property/${item.reference}`)} className="flex-row gap-3 rounded-apple bg-paper p-3">
            <Image source={{ uri: item.cover }} style={{ width: 88, height: 88, borderRadius: 12 }} contentFit="cover" />
            <View className="flex-1 justify-between py-0.5">
              <Text className="text-base font-semibold text-ink" numberOfLines={2}>{item.title}</Text>
              <Text className="text-sm text-graphite">{item.community}</Text>
              <View className="flex-row items-center justify-between">
                <Text className="font-bold text-ink">{aed(item.priceAed)}</Text>
                <CreditBadge award={item.credit} />
              </View>
            </View>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggle(item.reference); }}
              hitSlop={10}
              className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-mist"
            >
              <Heart size={16} color="#ff4d6d" fill="#ff4d6d" />
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="mt-24 items-center gap-3 px-10">
            <HeartOff size={36} color={colors.graphiteLight} />
            <Text className="text-center text-base text-graphite">
              No saved homes yet. Tap the heart on any listing to keep it here.
            </Text>
          </View>
        }
      />
    </View>
  );
}
