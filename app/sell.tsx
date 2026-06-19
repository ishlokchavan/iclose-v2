import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Home } from 'lucide-react-native';
import { colors } from '@/theme/tokens';

/** List-your-property entry point (modal). Wire to /api/listing to submit. */
export default function SellScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row justify-end px-5">
        <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-full bg-mist">
          <X size={20} color={colors.ink} />
        </Pressable>
      </View>
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-journey-listing/30">
          <Home size={30} color={colors.ink} />
        </View>
        <Text className="text-center text-2xl font-bold text-ink">List your home, commission-free</Text>
        <Text className="text-center text-base text-graphite">
          Sellers keep what they’d normally pay an agent. Snap a few photos and we’ll handle the rest.
        </Text>
        <Pressable className="mt-2 w-full rounded-apple bg-ink py-4">
          <Text className="text-center font-semibold text-white">Start a listing</Text>
        </Pressable>
      </View>
    </View>
  );
}
