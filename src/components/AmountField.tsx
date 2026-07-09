import { View, Text, TextInput, Pressable } from 'react-native';
import { withCommas } from '@/lib/format';
import { colors } from '@/theme/tokens';

const QUICK = [
  { label: '500K', v: 500_000 },
  { label: '1M', v: 1_000_000 },
  { label: '2M', v: 2_000_000 },
  { label: '5M', v: 5_000_000 },
  { label: '10M', v: 10_000_000 },
];

/** AED amount input with live comma formatting + quick-add chips. `value` is the
 *  raw digit string; `onChange` receives raw digits. */
export function AmountField({ label, value, onChange }: { label: string; value: string; onChange: (digits: string) => void }) {
  return (
    <View>
      <Text className="mb-1.5 text-[13px] font-medium text-graphite">{label}</Text>
      <View className="flex-row items-center rounded-2xl border border-hairline bg-surface2 px-4">
        <Text className="mr-2 text-[15px] font-semibold text-graphite">AED</Text>
        <TextInput
          value={withCommas(value)}
          onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ''))}
          placeholder="0"
          keyboardType="number-pad"
          placeholderTextColor={colors.graphiteLight}
          className="flex-1 py-3.5 text-[17px] font-semibold text-ink"
        />
      </View>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {QUICK.map((q) => (
          <Pressable key={q.label} onPress={() => onChange(String(q.v))} className="rounded-full border border-hairline bg-surface2 px-3 py-1.5">
            <Text className="text-[12.5px] font-semibold text-ink">{q.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
