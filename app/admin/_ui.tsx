import { View, Text, TextInput, ActivityIndicator, type TextInputProps } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Press } from '@/components/Press';
import { colors } from '@/theme/tokens';

/**
 * Shared admin-console chrome. Underscore-prefixed so expo-router ignores it as
 * a route. Keeps every section screen visually consistent: dark header with a
 * back button, dark inputs, lime chips, loading + empty states.
 */

export function AdminHeader({ title, insetTop, right }: { title: string; insetTop: number; right?: React.ReactNode }) {
  return (
    <View style={{ paddingTop: insetTop + 8 }} className="flex-row items-center gap-2 px-4 pb-2">
      <Press onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-surface2">
        <ChevronLeft size={22} color={colors.ink} />
      </Press>
      <Text className="flex-1 text-[17px] font-semibold text-ink" numberOfLines={1}>{title}</Text>
      {right}
    </View>
  );
}

export function Loading() {
  return <ActivityIndicator className="mt-20" color={colors.accent} />;
}

export function Empty({ text }: { text: string }) {
  return <Text className="mt-16 text-center text-graphite">{text}</Text>;
}

export function Field({ label, multiline, ...props }: { label: string; multiline?: boolean } & TextInputProps) {
  return (
    <View>
      <Text className="mb-1.5 text-[13px] font-medium text-graphite">{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.graphiteLight}
        style={multiline ? { minHeight: 72, textAlignVertical: 'top' } : undefined}
        className="rounded-2xl border border-hairline bg-surface2 px-4 py-3.5 text-base text-ink"
      />
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Press
      onPress={onPress}
      className={`rounded-full px-3.5 py-2 ${active ? 'bg-accent' : 'border border-hairline bg-surface2'}`}
    >
      <Text className="text-[13px] font-semibold" style={{ color: active ? colors.onAccent : colors.ink }}>{label}</Text>
    </Press>
  );
}

/** Dashboard KPI tile. Pass `onPress` to make it navigate (chevron-less, whole tile tappable). */
export function StatTile({ label, value, accent, onPress }: { label: string; value: string; accent?: boolean; onPress?: () => void }) {
  const inner = (
    <>
      <Text className="text-[19px] font-bold" style={{ color: accent ? colors.accent : colors.ink }} numberOfLines={1}>{value}</Text>
      <Text className="mt-0.5 text-[11.5px] text-graphite" numberOfLines={1}>{label}</Text>
    </>
  );
  if (onPress) {
    return (
      <Press onPress={onPress} className="rounded-apple border border-hairline bg-surface px-3 py-3.5">
        {inner}
      </Press>
    );
  }
  return <View className="rounded-apple border border-hairline bg-surface px-3 py-3.5">{inner}</View>;
}

/** Solid lime primary action; dark foreground. Pass `busy` to show a spinner. */
export function PrimaryButton({ label, onPress, busy, disabled }: { label: string; onPress: () => void; busy?: boolean; disabled?: boolean }) {
  return (
    <Press
      onPress={onPress}
      disabled={busy || disabled}
      className={`items-center justify-center rounded-full py-4 ${disabled && !busy ? 'bg-accent/40' : 'bg-accent'}`}
    >
      {busy ? (
        <ActivityIndicator color={colors.onAccent} />
      ) : (
        <Text className="text-[16px] font-semibold" style={{ color: colors.onAccent }}>{label}</Text>
      )}
    </Press>
  );
}
