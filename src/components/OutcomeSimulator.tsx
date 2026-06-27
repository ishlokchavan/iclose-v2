import { View, Text, Pressable } from 'react-native';
import { Home, Coins, TrendingUp } from 'lucide-react-native';
import { AmountSlider } from '@/components/AmountSlider';
import { Term } from '@/components/Term';
import { outcomeFor, effectivePrice, formatAed } from '@/lib/shares';
import { availableTokens, minInvestmentAed } from '@/types/shares';
import type { ShareAsset } from '@/types/shares';
import { colors } from '@/theme/tokens';

/** Sensible slider bounds for an offering (floors at the minimum investment). */
export function simulatorBounds(asset: ShareAsset) {
  const unit = effectivePrice(asset);
  const min = minInvestmentAed(asset);
  const cap = Math.min(100000, Math.max(min * 20, availableTokens(asset) * unit));
  return { min, max: Math.max(min, cap), step: unit };
}

/**
 * The signature interaction: drag "how much to invest" and instantly see, in
 * plain words, what you'd actually get — monthly rent and 5-year value. No
 * tokens, no yield %, no jargon up front.
 */
export function OutcomeSimulator({
  asset, amount, onAmountChange,
}: { asset: ShareAsset; amount: number; onAmountChange: (v: number) => void }) {
  const { min, max, step } = simulatorBounds(asset);
  const o = outcomeFor(asset, amount);

  return (
    <View className="rounded-apple border border-white/60 bg-white/85 p-4"
      style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
      <Text className="text-[13px] font-medium text-graphite">How much would you like to put in?</Text>
      <Text className="mt-1 text-[34px] font-bold text-ink">{formatAed(o.amount)}</Text>

      <View className="mt-1"><AmountSlider min={min} max={max} step={step} value={amount} onChange={onAmountChange} /></View>
      <View className="flex-row justify-between">
        <Text className="text-[11px] text-graphiteLight">{formatAed(min, { compact: true })}</Text>
        <Text className="text-[11px] text-graphiteLight">{formatAed(max, { compact: true })}</Text>
      </View>

      <View className="mt-2 flex-row gap-2">
        {[1000, 5000, 10000, 25000].filter((q) => q <= max && q >= min).map((q) => (
          <Pressable key={q} onPress={() => onAmountChange(q)} className="flex-1 items-center rounded-full border border-hairline/70 bg-white/70 py-1.5">
            <Text className="text-[12px] font-medium text-ink700">{formatAed(q, { compact: true })}</Text>
          </Pressable>
        ))}
      </View>

      {/* What you'd get — plain English */}
      <View className="mt-4 gap-3 rounded-2xl bg-accent/5 p-3.5">
        <Row icon={Home} tint={colors.accent} label="Your slice of this home" value={formatAed(o.amount)} />
        <Row icon={Coins} tint="#059669" value={`~${formatAed(Math.round(o.monthly))}`}
          label={<Text className="text-[13.5px] text-ink700"><Term k="rent">Rent</Term> each month</Text>} />
        <Row icon={TrendingUp} tint="#0071e3" value={`~${formatAed(Math.round(o.fiveYearValue), { compact: true })}`}
          label={<Text className="text-[13.5px] text-ink700">Could be <Term k="appreciation">worth</Term> in 5 years</Text>} />
      </View>
      <Text className="mt-2 text-center text-[11.5px] text-graphiteLight">
        Plus about {formatAed(Math.round(o.fiveYearRent))} rent over 5 years · that’s a {o.stakePct.toFixed(2)}% stake ({o.tokens.toLocaleString()} shares)
      </Text>
    </View>
  );
}

function Row({ icon: Icon, tint, label, value }: { icon: typeof Home; tint: string; label: React.ReactNode; value: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View style={{ backgroundColor: `${tint}1A` }} className="h-8 w-8 items-center justify-center rounded-full">
        <Icon size={16} color={tint} />
      </View>
      <View className="flex-1">{typeof label === 'string' ? <Text className="text-[13.5px] text-ink700">{label}</Text> : label}</View>
      <Text className="text-[15px] font-semibold text-ink">{value}</Text>
    </View>
  );
}
