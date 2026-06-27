import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  ShieldCheck, Landmark, BadgeCheck, Building2, TrendingUp, BadgePercent,
} from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { formatAed, outcomeFor } from '@/lib/shares';
import { availableTokens, fundedPct, minInvestmentAed } from '@/types/shares';
import type { ShareAsset } from '@/types/shares';

/** Compliance signal chips — the regulatory stack a production build would use. */
export function ComplianceRow() {
  const items = [
    { icon: Landmark, label: 'DLD-tokenized title' },
    { icon: ShieldCheck, label: 'VARA framework' },
    { icon: Building2, label: 'Licensed custodian' },
    { icon: BadgeCheck, label: 'KYC verified' },
  ];
  return (
    <View className="mt-3 flex-row flex-wrap gap-2 px-4">
      {items.map((it) => (
        <View key={it.label} className="flex-row items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-2.5 py-1.5">
          <it.icon size={13} color={colors.accent} />
          <Text className="text-[11.5px] font-medium text-ink700">{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

/** Small "Regulated by VARA · DLD" trust line. */
export function RegulatedNote() {
  return (
    <View className="flex-row items-center justify-center gap-1.5 py-2">
      <ShieldCheck size={12} color={colors.graphiteLight} />
      <Text className="text-[11px] text-graphiteLight">Regulated framework — VARA · Dubai Land Department</Text>
    </View>
  );
}

/** Simple funding progress bar. */
export function FundingBar({ asset }: { asset: ShareAsset }) {
  const pct = fundedPct(asset);
  const funded = asset.status !== 'funding';
  return (
    <View>
      <View className="h-1.5 overflow-hidden rounded-full bg-black/8">
        <View
          style={{ width: `${Math.max(3, pct)}%`, backgroundColor: funded ? colors.journey.listing : colors.accent }}
          className="h-full rounded-full"
        />
      </View>
      <View className="mt-1.5 flex-row items-center justify-between">
        <Text className="text-[12px] font-medium text-ink">{pct.toFixed(0)}% funded</Text>
        <Text className="text-[12px] text-graphite">
          {funded ? 'Fully funded' : `${availableTokens(asset).toLocaleString()} shares left`}
        </Text>
      </View>
    </View>
  );
}

/** A small label/value stat block. */
export function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View className="flex-1">
      <Text className="text-[11px] uppercase tracking-wide text-graphiteLight">{label}</Text>
      <Text className={`mt-0.5 text-[15px] font-semibold ${accent ? 'text-accent' : 'text-ink'}`}>{value}</Text>
    </View>
  );
}

export function YieldChip({ asset }: { asset: ShareAsset }) {
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-emerald-500/12 px-2.5 py-1">
      <TrendingUp size={13} color="#059669" />
      <Text className="text-[12px] font-semibold text-emerald-700">{asset.grossYieldPct.toFixed(1)}% yield</Text>
    </View>
  );
}

export function DiscountBadge({ pct }: { pct: number }) {
  if (pct <= 0) return null;
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1">
      <BadgePercent size={12} color="#fff" />
      <Text className="text-[11px] font-bold text-white">{pct}% off</Text>
    </View>
  );
}

/** Filter chips for the marketplace. */
export type MarketFilter = 'all' | 'new' | 'off_plan' | 'funded';
export function FilterChips({ value, onChange }: { value: MarketFilter; onChange: (f: MarketFilter) => void }) {
  const chips: { key: MarketFilter; label: string }[] = [
    { key: 'all', label: 'Marketplace' },
    { key: 'new', label: 'New' },
    { key: 'off_plan', label: 'Off-plan' },
    { key: 'funded', label: 'Funded' },
  ];
  return (
    <View className="flex-row gap-2 px-4 pt-4">
      {chips.map((c) => {
        const active = value === c.key;
        return (
          <Pressable key={c.key} onPress={() => onChange(c.key)}
            className={`rounded-full px-3.5 py-2 ${active ? 'bg-accent' : 'border border-hairline/70 bg-white/70'}`}>
            <Text className={`text-[12.5px] font-semibold ${active ? 'text-white' : 'text-ink700'}`}>{c.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Clean offering card — photo, name, funding, then "From price" + earnings teaser. */
export function AssetCard({ asset }: { asset: ShareAsset }) {
  const teaser = outcomeFor(asset, 5000); // "what AED 5,000 earns" — outcome-first
  return (
    <Pressable
      onPress={() => router.push(`/shares/${asset.symbol}`)}
      className="overflow-hidden rounded-apple border border-white/60 bg-white/75"
      style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}
    >
      <View className="relative">
        <Image source={{ uri: asset.coverImageUrl ?? undefined }} style={{ width: '100%', aspectRatio: 1.8 }} contentFit="cover" />
        {asset.discountPct > 0 ? (
          <View className="absolute right-3 top-3"><DiscountBadge pct={asset.discountPct} /></View>
        ) : null}
        {asset.status === 'funded' ? (
          <View className="absolute left-3 top-3 rounded-full bg-emerald-600/90 px-2.5 py-1">
            <Text className="text-[11px] font-semibold text-white">Fully funded</Text>
          </View>
        ) : null}
      </View>
      <View className="p-4">
        <Text className="text-[16px] font-semibold text-ink" numberOfLines={1}>{asset.name}</Text>
        <Text className="text-[13px] text-graphite">{asset.community}, {asset.city}</Text>

        <View className="mt-3"><FundingBar asset={asset} /></View>

        <View className="mt-3.5 flex-row items-end justify-between border-t border-hairline/60 pt-3">
          <View>
            <Text className="text-[11px] uppercase tracking-wide text-graphiteLight">From</Text>
            <Text className="text-[16px] font-semibold text-ink">{formatAed(minInvestmentAed(asset))}</Text>
          </View>
          <View className="items-end">
            <Text className="text-[15px] font-semibold text-emerald-700">~{formatAed(Math.round(teaser.monthly))}/mo</Text>
            <Text className="text-[10.5px] text-graphiteLight">rent on {formatAed(5000, { compact: true })}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
