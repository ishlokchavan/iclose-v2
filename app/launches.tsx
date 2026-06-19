import { View, Text, FlatList, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useExperience } from '@/store/experience';
import { CreditBadge } from '@/components/CreditBadge';
import { aed } from '@/lib/format';
import { colors } from '@/theme/tokens';

/** New off-plan launches (modal). */
export default function LaunchesScreen() {
  const { launches } = useExperience();
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-fog" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center justify-between px-5 pb-2">
        <Text className="text-2xl font-bold text-ink">New launches</Text>
        <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-full bg-mist">
          <X size={20} color={colors.ink} />
        </Pressable>
      </View>
      <FlatList
        data={launches}
        keyExtractor={(l) => l.reference}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: insets.bottom + 24 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/property/${item.reference}`)} className="overflow-hidden rounded-apple bg-paper">
            <Image source={{ uri: item.cover }} style={{ width: '100%', height: 180 }} contentFit="cover" />
            <View className="gap-2 p-4">
              <CreditBadge award={item.credit} />
              <Text className="text-lg font-semibold text-ink" numberOfLines={1}>{item.title}</Text>
              <Text className="text-sm text-graphite">{item.community} · {item.developerName}</Text>
              <Text className="text-base font-bold text-ink">{aed(item.priceAed)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
