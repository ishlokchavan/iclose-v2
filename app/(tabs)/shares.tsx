import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Landmark, Wallet, PieChart, ArrowUpRight, Search, X } from 'lucide-react-native';
import { useShares } from '@/store/shares';
import { GlassBg } from '@/components/Glass';
import { AssetCard, FilterChips, RegulatedNote } from '@/components/SharesUI';
import { SharesIntro } from '@/components/SharesIntro';
import type { MarketFilter } from '@/components/SharesUI';
import { formatAed } from '@/lib/shares';
import { fundedPct } from '@/types/shares';
import { colors } from '@/theme/tokens';

/** Shares — tokenized real-estate marketplace (the 6th tab). */
export default function SharesScreen() {
  const s = useShares();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<MarketFilter>('all');
  const [query, setQuery] = useState('');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await s.refresh(); } finally { setRefreshing(false); }
  }, [s]);

  // Portfolio roll-up across the signed-in user's holdings.
  const value = s.holdings.reduce((sum, h) => { const a = s.byId(h.assetId); return sum + (a ? h.tokens * a.tokenPriceAed : 0); }, 0);
  const invested = s.holdings.reduce((sum, h) => sum + h.tokens * h.avgCostAed, 0);
  const monthlyIncome = s.holdings.reduce((sum, h) => { const a = s.byId(h.assetId); return sum + (a ? (h.tokens * a.tokenPriceAed * a.grossYieldPct) / 100 / 12 : 0); }, 0);
  const hasHoldings = s.holdings.length > 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return s.assets.filter((a) => {
      const passFilter =
        filter === 'funded' ? a.status !== 'funding'
        : filter === 'off_plan' ? a.completion === 'off_plan'
        : filter === 'new' ? a.status === 'funding' && fundedPct(a) < 40
        : a.status === 'funding';
      if (!passFilter) return false;
      if (!q) return true;
      return [a.name, a.community, a.city, a.symbol].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [s.assets, filter, query]);

  return (
    <View className="flex-1">
      <GlassBg />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {/* Header */}
        <View style={{ paddingTop: insets.top + 12 }} className="px-4 pb-1">
          <View className="flex-row items-center gap-2">
            <Landmark size={22} color={colors.accent} />
            <Text className="text-[26px] font-semibold text-ink">Shares</Text>
          </View>
          <Text className="mt-1 text-sm text-graphite">Own a piece of Dubai real estate — from {formatAed(500)}</Text>
        </View>

        {/* Portfolio strip — signed-in only */}
        {s.signedIn ? (
          <Pressable
            onPress={() => router.push('/shares/portfolio')}
            className="mx-4 mt-3 overflow-hidden rounded-apple border border-white/60 bg-white/80"
            style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}
          >
            <View className="flex-row items-center justify-between p-4">
              <View>
                <Text className="text-[11px] uppercase tracking-wide text-graphiteLight">Portfolio value</Text>
                <Text className="mt-0.5 text-[22px] font-semibold text-ink">{formatAed(value)}</Text>
                {hasHoldings ? (
                  <Text className="mt-0.5 text-[12.5px] text-emerald-700">
                    {value - invested >= 0 ? '+' : ''}{formatAed(value - invested)} · {formatAed(monthlyIncome)}/mo income
                  </Text>
                ) : (
                  <Text className="mt-0.5 text-[12.5px] text-graphite">No shares yet — start below</Text>
                )}
              </View>
              <View className="items-end gap-2">
                <View className="flex-row items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1.5">
                  <Wallet size={13} color={colors.accent} />
                  <Text className="text-[12px] font-semibold text-accent">{formatAed(s.wallet?.cashBalanceAed ?? 0, { compact: true })}</Text>
                </View>
                <View className="flex-row items-center gap-0.5">
                  <PieChart size={13} color={colors.graphite} />
                  <Text className="text-[12px] text-graphite">Portfolio</Text>
                  <ArrowUpRight size={12} color={colors.graphite} />
                </View>
              </View>
            </View>
          </Pressable>
        ) : null}

        {/* Search */}
        <View className="mx-4 mt-3 flex-row items-center gap-2 rounded-full border border-white/60 bg-white/75 px-4 py-2.5">
          <Search size={18} color={colors.graphite} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by area or property"
            placeholderTextColor={colors.graphiteLight}
            className="flex-1 text-[15px] text-ink"
          />
          {query ? <Pressable onPress={() => setQuery('')} hitSlop={8}><X size={16} color={colors.graphite} /></Pressable> : null}
        </View>

        {/* Filters */}
        <FilterChips value={filter} onChange={setFilter} />

        {/* Feed */}
        <View className="gap-3 px-4 pt-3">
          {filtered.map((a) => <AssetCard key={a.symbol} asset={a} />)}
          {!filtered.length ? (
            <Text className="py-12 text-center text-sm text-graphite">No homes match — try another search or filter.</Text>
          ) : null}
        </View>

        <RegulatedNote />
      </ScrollView>

      {/* First-run explainer (shown once) */}
      <SharesIntro />
    </View>
  );
}
