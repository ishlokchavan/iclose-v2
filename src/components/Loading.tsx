import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/tokens';

export function Loading() {
  return (
    <View className="flex-1 items-center justify-center bg-paper">
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}
