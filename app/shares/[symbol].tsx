import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, Minus, Plus, FileText, ShieldCheck, Landmark, Boxes,
  ArrowLeftRight, Coins, TrendingUp, CalendarClock, ExternalLink,
} from 'lucide-react-native';
import { useShares } from '@/store/shares';
import { GlassBg } from '@/components/Glass';
import { DemoBanner, FundingBar, Metric } from '@/components/SharesUI';
import { getAssetLedger, formatAed, shortHash, shortAddr } from '@/lib/shares';
import { availableTokens, minInvestmentAed } from '@/types/shares';
import type { ShareLedgerEntry } from '@/types/shares';
import { colors } from '@/theme/tokens';

type Tab = 'overview' | 'financials' | 'documents' | 'ledger';
const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'financials', label: 'Financials' },
  { key: 'documents', label: 'Documents' },
  { key: 'ledger', label: 'Ledger' },
];

export default function ShareDetailScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const s = useShares();
  const insets = useSafeAreaInsets();
  const asset = s.bySymbol(String(symbol));
  const holding = asset ? s.holdingFor(asset.id) : undefined;
  const dists = asset ? s.distributionsFor(asset.id) : [];

  const [tab, setTab] = useState<Tab>('overview');
  const [tokens, setTokens] = useState(20);
  const [ledger, setLedger] = useState<ShareLedgerEntry[]>([]);

  useEffect(() => {
    if (asset && /^[0-9a-f-]{36}$/i.test(asset.id)) getAssetLedger(asset.id, 12).then(setLedger);
  }, [asset]);

  const calc = useMemo(() => {
    if (!asset) return null;
    const cost = tokens * asset.tokenPriceAed;
    const annualNet = (cost * asset.netYieldPct) / 100;
    const appreciation = (cost * asset.appreciationPct) / 100;
    const totalYr = annualNet + appreciation;
    return {
      cost, annualNet, monthlyNet: annualNet / 12, appreciation,
      totalYr, totalPct: cost > 0 ? (totalYr / cost) * 100 : 0,
    };
  }, [asset, tokens]);

  if (!asset) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-graphite">Offering not found.</Text>
        <Pressable onPress={() => router.back()} className="mt-3 rounded-full bg-accent px-4 py-2">
          <Text className="font-semibold text-white">Go back</Text>
        </Pressable>
      </View>
    );
  }

  const funded = asset.status !== 'funding';
  const startInvest = (mode: 'buy' | 'sell') => {
    if (!s.signedIn) { router.push('/(tabs)/profile'); return; }
    if (s.wallet?.kycStatus !== 'verified') { router.push('/shares/kyc'); return; }
    router.push(`/shares/invest?symbol=${asset.symbol}&mode=${mode}`);
  };

  const docRows = [
    { icon: Landmark, title: 'Tokenized title deed', sub: asset.dldDeedRef ?? 'DLD-registered' },
    { icon: FileText, title: 'Offering prospectus', sub: 'PDF · 24 pages' },
    { icon: ShieldCheck, title: 'Custodian & SPV agreement', sub: 'Licensed custodian' },
    { icon: Boxes, title: 'Independent valuation report', sub: 'RICS-aligned' },
  ];

  return (
    <View className="flex-1">
      <GlassBg />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        {/* Cover */}
        <View className="relative">
          <Image source={{ uri: asset.coverImageUrl ?? undefined }} style={{ width: '100%', height: 280 }} contentFit="cover" />
          <Pressable
            onPress={() => router.back()}
            style={{ top: insets.top + 8 }}
            className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-black/40"
          >
            <ChevronLeft size={22} color="#fff" />
          </Pressable>
          <View className="absolute bottom-3 left-4 flex-row items-center gap-2">
            <View className="rounded-full bg-black/45 px-2.5 py-1">
              <Text className="text-[11px] font-semibold tracking-wide text-white">{asset.symbol}</Text>
            </View>
            <View className="flex-row items-center gap-1 rounded-full bg-emerald-600/90 px-2.5 py-1">
              <TrendingUp size={12} color="#fff" />
              <Text className="text-[11px] font-semibold text-white">{asset.grossYieldPct.toFixed(1)}% gross yield</Text>
            </View>
          </View>
        </View>

        <View className="px-4 pt-4">
          <Text className="text-[21px] font-semibold text-ink">{asset.name}</Text>
          <Text className="text-[13.5px] text-graphite">{asset.community}, {asset.city}</Text>
        </View>

        {/* Key metrics */}
        <View className="mx-4 mt-3 flex-row gap-3 rounded-apple border border-white/60 bg-white/75 p-4">
          <Metric label="Share price" value={formatAed(asset.tokenPriceAed)} />
          <Metric label="Min. invest" value={formatAed(minInvestmentAed(asset))} />
          <Metric label="Appreciation" value={`${asset.appreciationPct.toFixed(0)}%/yr`} accent />
        </View>

        {/* Funding */}
        <View className="mx-4 mt-3 rounded-apple border border-white/60 bg-white/75 p-4">
          <FundingBar asset={asset} />
          <View className="mt-3 flex-row gap-3 border-t border-hairline/60 pt-3">
            <Metric label="Property value" value={formatAed(asset.propertyValueAed, { compact: true })} />
            <Metric label="Total shares" value={asset.totalTokens.toLocaleString()} />
            <Metric label="Deadline" value={asset.fundingDeadline ?? '—'} />
          </View>
        </View>

        {/* Your position */}
        {holding && holding.tokens > 0 ? (
          <View className="mx-4 mt-3 rounded-apple border border-accent/30 bg-accent/5 p-4">
            <Text className="text-[12px] font-semibold uppercase tracking-wide text-accent">Your position</Text>
            <View className="mt-2 flex-row gap-3">
              <Metric label="Shares" value={holding.tokens.toLocaleString()} />
              <Metric label="Value" value={formatAed(holding.tokens * asset.tokenPriceAed)} />
              <Metric label="Avg cost" value={formatAed(holding.avgCostAed)} />
            </View>
          </View>
        ) : null}

        <DemoBanner compact />

        {/* Segmented tabs */}
        <View className="mx-4 mt-4 flex-row rounded-full bg-black/5 p-1">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <Pressable key={t.key} onPress={() => setTab(t.key)} className={`flex-1 items-center rounded-full py-2 ${active ? 'bg-white' : ''}`}
                style={active ? styles.segActive : undefined}>
                <Text className={`text-[12.5px] font-semibold ${active ? 'text-ink' : 'text-graphite'}`}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View className="px-4 pt-4">
          {tab === 'overview' ? (
            <View className="gap-2">
              {asset.highlights.map((h) => (
                <View key={h} className="flex-row items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-3.5 py-3">
                  <View className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <Text className="text-[14px] text-ink700">{h}</Text>
                </View>
              ))}
              <Text className="mt-2 text-[13.5px] leading-5 text-graphite">
                {asset.name} is offered as {asset.totalTokens.toLocaleString()} digital shares of {formatAed(asset.tokenPriceAed)} each,
                backed by a {asset.dldDeedRef ? 'DLD-tokenized' : 'registered'} title deed held by a licensed custodian.
                Shareholders earn proportional rental income (paid as distributions) and any change in property value.
              </Text>
            </View>
          ) : null}

          {tab === 'financials' && calc ? (
            <View>
              {/* Calculator */}
              <View className="rounded-apple border border-white/60 bg-white/75 p-4">
                <Text className="text-[13px] font-semibold text-ink">Returns calculator</Text>
                <View className="mt-3 flex-row items-center justify-between">
                  <Pressable onPress={() => setTokens((n) => Math.max(asset.minTokens, n - 10))}
                    className="h-10 w-10 items-center justify-center rounded-full bg-black/5">
                    <Minus size={18} color={colors.ink} />
                  </Pressable>
                  <View className="items-center">
                    <Text className="text-[24px] font-semibold text-ink">{tokens.toLocaleString()}</Text>
                    <Text className="text-[11px] text-graphite">shares · {formatAed(calc.cost)}</Text>
                  </View>
                  <Pressable onPress={() => setTokens((n) => Math.min(availableTokens(asset) || n + 10, n + 10))}
                    className="h-10 w-10 items-center justify-center rounded-full bg-black/5">
                    <Plus size={18} color={colors.ink} />
                  </Pressable>
                </View>
                <View className="mt-3 flex-row gap-2">
                  {[10, 50, 100, 500].map((q) => (
                    <Pressable key={q} onPress={() => setTokens(q)} className="flex-1 items-center rounded-full border border-hairline/70 bg-white/70 py-1.5">
                      <Text className="text-[12px] font-medium text-ink700">{q}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="mt-3 rounded-apple border border-white/60 bg-white/75 p-4">
                <View className="flex-row gap-3">
                  <Metric label="Net rental / yr" value={formatAed(calc.annualNet)} />
                  <Metric label="Monthly income" value={formatAed(calc.monthlyNet)} accent />
                </View>
                <View className="mt-3 flex-row gap-3 border-t border-hairline/60 pt-3">
                  <Metric label="Appreciation / yr" value={formatAed(calc.appreciation)} />
                  <Metric label="Est. total / yr" value={`${formatAed(calc.totalYr)} (${calc.totalPct.toFixed(1)}%)`} accent />
                </View>
                <Text className="mt-3 text-[11px] leading-4 text-graphiteLight">
                  Illustrative only. Net yield {asset.netYieldPct}% + appreciation {asset.appreciationPct}% p.a. Actual returns vary.
                </Text>
              </View>

              {/* Distribution history */}
              {dists.length ? (
                <View className="mt-3 rounded-apple border border-white/60 bg-white/75 p-4">
                  <Text className="text-[13px] font-semibold text-ink">Recent distributions</Text>
                  {dists.slice(0, 4).map((d) => (
                    <View key={d.id} className="mt-2.5 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Coins size={14} color={colors.accent} />
                        <Text className="text-[13px] text-ink700">{d.period} rental</Text>
                      </View>
                      <Text className="text-[13px] font-medium text-ink">{formatAed(d.perTokenAed)}/share</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="mt-3 px-1 text-[12.5px] text-graphite">
                  Off-plan — rental distributions begin after handover.
                </Text>
              )}
            </View>
          ) : null}

          {tab === 'documents' ? (
            <View className="gap-2.5">
              {docRows.map((d) => (
                <Pressable key={d.title} onPress={() => Alert.alert('Demo document', `“${d.title}” would open here in a production build.`)}
                  className="flex-row items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-3.5 py-3.5">
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-accent/10">
                    <d.icon size={17} color={colors.accent} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[14px] font-medium text-ink">{d.title}</Text>
                    <Text className="text-[12px] text-graphite">{d.sub}</Text>
                  </View>
                  <ExternalLink size={16} color={colors.graphiteLight} />
                </Pressable>
              ))}
              <Text className="mt-1 px-1 text-[11px] leading-4 text-graphiteLight">
                Documents are illustrative placeholders for this demonstration.
              </Text>
            </View>
          ) : null}

          {tab === 'ledger' ? (
            <View>
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-[13px] font-semibold text-ink">On-chain activity</Text>
                <Pressable onPress={() => router.push('/shares/ledger')} className="flex-row items-center gap-1">
                  <Text className="text-[12.5px] font-medium text-accent">Full ledger</Text>
                  <ExternalLink size={13} color={colors.accent} />
                </Pressable>
              </View>
              {ledger.length ? ledger.map((e) => <LedgerRow key={e.txHash} e={e} />) : (
                <View className="items-center rounded-apple border border-white/60 bg-white/70 py-8">
                  <Text className="text-[13px] text-graphite">No on-chain activity yet.</Text>
                  <Text className="text-[12px] text-graphiteLight">Be the first to invest in this property.</Text>
                </View>
              )}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky action bar */}
      <View style={{ paddingBottom: insets.bottom + 10 }} className="absolute inset-x-0 bottom-0 flex-row gap-3 border-t border-hairline/50 bg-white/90 px-4 pt-3">
        {funded ? (
          <Pressable onPress={() => router.push(`/shares/market?symbol=${asset.symbol}`)} className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-accent py-3.5">
            <ArrowLeftRight size={17} color="#fff" />
            <Text className="text-[15px] font-semibold text-white">Trade on secondary market</Text>
          </Pressable>
        ) : (
          <>
            <Pressable onPress={() => router.push(`/shares/market?symbol=${asset.symbol}`)} className="flex-row items-center justify-center gap-1.5 rounded-full border border-hairline bg-white px-5 py-3.5">
              <ArrowLeftRight size={16} color={colors.ink} />
              <Text className="text-[14px] font-semibold text-ink">Trade</Text>
            </Pressable>
            <Pressable onPress={() => startInvest('buy')} className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-accent py-3.5">
              <Coins size={17} color="#fff" />
              <Text className="text-[15px] font-semibold text-white">Invest from {formatAed(minInvestmentAed(asset))}</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function LedgerRow({ e }: { e: ShareLedgerEntry }) {
  const tint: Record<string, string> = {
    buy: '#0071e3', sell: '#b45309', dividend: '#059669', transfer: '#7c3aed', deposit: '#6e6e73',
  };
  return (
    <View className="mb-2 flex-row items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-3.5 py-3">
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <View style={{ backgroundColor: `${tint[e.type]}1A` }} className="rounded-full px-2 py-0.5">
            <Text style={{ color: tint[e.type] }} className="text-[10.5px] font-semibold uppercase">{e.type}</Text>
          </View>
          <Text className="text-[12px] text-graphite">#{e.blockNumber}</Text>
        </View>
        <Text className="mt-1 text-[11.5px] text-graphiteLight">{shortHash(e.txHash)} · {shortAddr(e.actorAddress)}</Text>
      </View>
      <View className="items-end">
        {e.tokens > 0 ? <Text className="text-[13px] font-semibold text-ink">{e.tokens.toLocaleString()} shares</Text> : null}
        <Text className="text-[12px] text-graphite">{formatAed(e.totalAed)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  segActive: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
});
