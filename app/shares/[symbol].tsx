import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, Minus, Plus, FileText, ShieldCheck, Landmark, Boxes, Bed, Bath,
  Maximize2, Sparkles, ArrowLeftRight, Coins, TrendingUp, ExternalLink,
  ShoppingCart, FileCheck2, CalendarCheck,
} from 'lucide-react-native';
import { useShares } from '@/store/shares';
import { getListingByReference } from '@/lib/listings';
import type { Listing } from '@/types/listing';
import { GlassBg } from '@/components/Glass';
import { DemoBanner, FundingBar, Metric, RegulatedNote, DiscountBadge } from '@/components/SharesUI';
import { getAssetLedger, formatAed, shortHash, shortAddr, feeBreakdown } from '@/lib/shares';
import { availableTokens, minInvestmentAed, discountedTokenPrice, marketUpliftPct } from '@/types/shares';
import type { ShareLedgerEntry } from '@/types/shares';
import { colors } from '@/theme/tokens';

type Tab = 'overview' | 'property' | 'financials' | 'ledger';
const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'property', label: 'Property' },
  { key: 'financials', label: 'Financials' },
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
  const [listing, setListing] = useState<Listing | null>(null);
  const [descOpen, setDescOpen] = useState(false);

  useEffect(() => {
    if (asset && /^[0-9a-f-]{36}$/i.test(asset.id)) getAssetLedger(asset.id, 12).then(setLedger);
  }, [asset]);
  useEffect(() => {
    if (asset?.listingReference) getListingByReference(asset.listingReference).then(setListing);
  }, [asset?.listingReference]);

  const calc = useMemo(() => {
    if (!asset) return null;
    const cost = tokens * asset.tokenPriceAed;
    const annualNet = (cost * asset.netYieldPct) / 100;
    const appreciation = (cost * asset.appreciationPct) / 100;
    const totalYr = annualNet + appreciation;
    return { cost, annualNet, monthlyNet: annualNet / 12, appreciation, totalYr, totalPct: cost > 0 ? (totalYr / cost) * 100 : 0 };
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
  const price = discountedTokenPrice(asset);
  const uplift = marketUpliftPct(asset);
  const fees = feeBreakdown(asset, tokens);

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
  const steps = [
    { icon: ShoppingCart, title: 'Buy your shares', sub: `From ${formatAed(minInvestmentAed(asset))} — pick how many shares you want.` },
    { icon: FileCheck2, title: 'Ownership recorded', sub: 'Your shares are minted to your wallet and the title is held by a licensed custodian.' },
    { icon: CalendarCheck, title: 'Earn monthly rent', sub: 'Receive your share of rental income as distributions, plus any value growth.' },
  ];
  const amenities = listing?.amenities ?? [];

  return (
    <View className="flex-1">
      <GlassBg />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        {/* Cover */}
        <View className="relative">
          <Image source={{ uri: asset.coverImageUrl ?? undefined }} style={{ width: '100%', height: 280 }} contentFit="cover" />
          <Pressable onPress={() => router.back()} style={{ top: insets.top + 8 }}
            className="absolute left-4 h-10 w-10 items-center justify-center rounded-full bg-black/40">
            <ChevronLeft size={22} color="#fff" />
          </Pressable>
          <View className="absolute bottom-3 left-4 flex-row items-center gap-2">
            <View className="rounded-full bg-black/45 px-2.5 py-1"><Text className="text-[11px] font-semibold tracking-wide text-white">{asset.symbol}</Text></View>
            <View className="flex-row items-center gap-1 rounded-full bg-emerald-600/90 px-2.5 py-1">
              <TrendingUp size={12} color="#fff" /><Text className="text-[11px] font-semibold text-white">{asset.grossYieldPct.toFixed(1)}% gross yield</Text>
            </View>
            {asset.discountPct > 0 ? <DiscountBadge pct={asset.discountPct} /> : null}
          </View>
        </View>

        <View className="px-4 pt-4">
          <Text className="text-[21px] font-semibold text-ink">{asset.name}</Text>
          <Text className="text-[13.5px] text-graphite">{asset.community}, {asset.city}</Text>
        </View>

        {/* Key metrics */}
        <View className="mx-4 mt-3 flex-row gap-3 rounded-apple border border-white/60 bg-white/75 p-4">
          <View className="flex-1">
            <Text className="text-[11px] uppercase tracking-wide text-graphiteLight">Share price</Text>
            <View className="flex-row items-baseline gap-1.5">
              <Text className="mt-0.5 text-[15px] font-semibold text-ink">{formatAed(price)}</Text>
              {asset.discountPct > 0 ? <Text className="text-[11px] text-graphiteLight line-through">{formatAed(asset.tokenPriceAed)}</Text> : null}
            </View>
          </View>
          <Metric label="Min. invest" value={formatAed(minInvestmentAed(asset))} />
          <Metric label="Appreciation" value={`${asset.appreciationPct.toFixed(0)}%/yr`} accent />
        </View>

        {/* Funding */}
        <View className="mx-4 mt-3 rounded-apple border border-white/60 bg-white/75 p-4">
          <FundingBar asset={asset} />
          <View className="mt-3 flex-row gap-3 border-t border-hairline/60 pt-3">
            <Metric label="Total shares" value={asset.totalTokens.toLocaleString()} />
            <Metric label="Investors" value={asset.investorCount.toLocaleString()} />
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

        {/* Tabs */}
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
          {/* OVERVIEW */}
          {tab === 'overview' ? (
            <View className="gap-3">
              {/* Market value uplift */}
              <View className="flex-row gap-3 rounded-apple border border-white/60 bg-white/75 p-4">
                <View className="flex-1">
                  <Text className="text-[11px] uppercase tracking-wide text-graphiteLight">Tokenized value</Text>
                  <Text className="mt-0.5 text-[16px] font-semibold text-ink">{formatAed(asset.propertyValueAed, { compact: true })}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[11px] uppercase tracking-wide text-graphiteLight">Market value</Text>
                  <View className="flex-row items-baseline gap-1.5">
                    <Text className="mt-0.5 text-[16px] font-semibold text-ink">{formatAed(asset.marketValueAed ?? asset.propertyValueAed, { compact: true })}</Text>
                    {uplift > 0 ? <Text className="text-[12px] font-semibold text-emerald-700">+{uplift.toFixed(0)}%</Text> : null}
                  </View>
                </View>
              </View>

              {/* Highlights */}
              <View className="gap-2">
                {asset.highlights.map((h) => (
                  <View key={h} className="flex-row items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-3.5 py-3">
                    <View className="h-1.5 w-1.5 rounded-full bg-accent" />
                    <Text className="text-[14px] text-ink700">{h}</Text>
                  </View>
                ))}
              </View>

              <Text className="text-[13.5px] leading-5 text-graphite">
                {asset.name} is offered as {asset.totalTokens.toLocaleString()} digital shares of {formatAed(asset.tokenPriceAed)} each,
                backed by a {asset.dldDeedRef ? 'DLD-tokenized' : 'registered'} title deed held by a licensed custodian. Shareholders
                earn proportional rental income (paid as distributions) and any change in property value.
              </Text>

              {/* How it works */}
              <Text className="pt-2 text-[15px] font-semibold text-ink">How it works</Text>
              <View className="rounded-apple border border-white/60 bg-white/75 p-4">
                {steps.map((st, i) => (
                  <View key={st.title} className="flex-row gap-3" >
                    <View className="items-center">
                      <View className="h-8 w-8 items-center justify-center rounded-full bg-accent/10"><st.icon size={16} color={colors.accent} /></View>
                      {i < steps.length - 1 ? <View className="my-1 w-px flex-1 bg-hairline" /> : null}
                    </View>
                    <View className={`flex-1 ${i < steps.length - 1 ? 'pb-4' : ''}`}>
                      <Text className="text-[14px] font-semibold text-ink">{st.title}</Text>
                      <Text className="mt-0.5 text-[12.5px] leading-4 text-graphite">{st.sub}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Documents */}
              <Text className="pt-2 text-[15px] font-semibold text-ink">Documents</Text>
              <View className="gap-2.5">
                {docRows.map((d) => (
                  <Pressable key={d.title} onPress={() => Alert.alert('Demo document', `“${d.title}” would open here in a production build.`)}
                    className="flex-row items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-3.5 py-3.5">
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-accent/10"><d.icon size={17} color={colors.accent} /></View>
                    <View className="flex-1"><Text className="text-[14px] font-medium text-ink">{d.title}</Text><Text className="text-[12px] text-graphite">{d.sub}</Text></View>
                    <ExternalLink size={16} color={colors.graphiteLight} />
                  </Pressable>
                ))}
              </View>
              <RegulatedNote />
            </View>
          ) : null}

          {/* PROPERTY */}
          {tab === 'property' ? (
            <View className="gap-4">
              <View>
                <Text className="mb-2 text-[15px] font-semibold text-ink">About the property</Text>
                <View className="flex-row flex-wrap gap-y-3 rounded-apple border border-white/60 bg-white/75 p-4">
                  <Spec icon={Bed} label={`${listing?.bedrooms ?? '—'} Bed`} />
                  <Spec icon={Bath} label={`${listing?.bathrooms ?? '—'} Bath`} />
                  <Spec icon={Maximize2} label={listing?.areaSqft ? `${listing.areaSqft.toLocaleString()} sqft` : '—'} />
                  <Spec icon={Landmark} label={(listing?.propertyType ?? asset.propertyType ?? 'Property')} cap />
                </View>
              </View>

              {listing?.description ? (
                <View>
                  <Text className="mb-1.5 text-[15px] font-semibold text-ink">Description</Text>
                  <Text className="text-[13.5px] leading-5 text-graphite" numberOfLines={descOpen ? undefined : 4}>{listing.description}</Text>
                  {listing.description.length > 180 ? (
                    <Pressable onPress={() => setDescOpen((v) => !v)}><Text className="mt-1 text-[13px] font-medium text-accent">{descOpen ? 'Read less' : 'Read more'}</Text></Pressable>
                  ) : null}
                </View>
              ) : null}

              {amenities.length ? (
                <View>
                  <Text className="mb-2 text-[15px] font-semibold text-ink">Amenities</Text>
                  <View className="flex-row flex-wrap">
                    {amenities.map((a) => (
                      <View key={a} className="mb-2.5 w-1/2 flex-row items-center gap-2 pr-2">
                        <Sparkles size={15} color={colors.accent} /><Text className="flex-1 text-[13.5px] text-ink700" numberOfLines={1}>{a}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {!listing ? <Text className="py-6 text-center text-[13px] text-graphite">Loading property details…</Text> : null}
            </View>
          ) : null}

          {/* FINANCIALS */}
          {tab === 'financials' && calc ? (
            <View>
              {/* Calculator */}
              <View className="rounded-apple border border-white/60 bg-white/75 p-4">
                <Text className="text-[13px] font-semibold text-ink">Returns calculator</Text>
                <View className="mt-3 flex-row items-center justify-between">
                  <Pressable onPress={() => setTokens((n) => Math.max(asset.minTokens, n - 10))} className="h-10 w-10 items-center justify-center rounded-full bg-black/5"><Minus size={18} color={colors.ink} /></Pressable>
                  <View className="items-center"><Text className="text-[24px] font-semibold text-ink">{tokens.toLocaleString()}</Text><Text className="text-[11px] text-graphite">shares · {formatAed(calc.cost)}</Text></View>
                  <Pressable onPress={() => setTokens((n) => Math.min(availableTokens(asset) || n + 10, n + 10))} className="h-10 w-10 items-center justify-center rounded-full bg-black/5"><Plus size={18} color={colors.ink} /></Pressable>
                </View>
                <View className="mt-3 flex-row gap-2">
                  {[10, 50, 100, 500].map((q) => (
                    <Pressable key={q} onPress={() => setTokens(q)} className="flex-1 items-center rounded-full border border-hairline/70 bg-white/70 py-1.5"><Text className="text-[12px] font-medium text-ink700">{q}</Text></Pressable>
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
                <Text className="mt-3 text-[11px] leading-4 text-graphiteLight">Illustrative. Net yield {asset.netYieldPct}% + appreciation {asset.appreciationPct}% p.a. Actual returns vary.</Text>
              </View>

              {/* Cost breakdown */}
              <Text className="pt-4 text-[15px] font-semibold text-ink">Investment cost breakdown</Text>
              <View className="mt-2 rounded-apple border border-white/60 bg-white/75 p-4">
                <FeeRow label="Share amount" value={formatAed(fees.amount)} />
                <FeeRow label="Purchase costs (3%)" value={formatAed(fees.purchaseCosts)} />
                <FeeRow label="iClose platform fee (1.5%)" value={formatAed(fees.platformFee)} />
                <FeeRow label="DLD transfer fee (2%)" value={formatAed(fees.dldDiscounted)} strike={formatAed(fees.dldFull)} />
                <View className="my-2 h-px bg-hairline/60" />
                <FeeRow label="Total (real-world)" value={formatAed(fees.total)} bold />
                <Text className="mt-2 text-[11px] leading-4 text-graphiteLight">Illustrative real-world costs. The DLD 2% reflects the tokenization-pilot rate (vs 4%). This demo debits only the share amount.</Text>
              </View>

              {/* Distributions */}
              {dists.length ? (
                <View className="mt-3 rounded-apple border border-white/60 bg-white/75 p-4">
                  <Text className="text-[13px] font-semibold text-ink">Recent distributions</Text>
                  {dists.slice(0, 4).map((d) => (
                    <View key={d.id} className="mt-2.5 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2"><Coins size={14} color={colors.accent} /><Text className="text-[13px] text-ink700">{d.period} rental</Text></View>
                      <Text className="text-[13px] font-medium text-ink">{formatAed(d.perTokenAed)}/share</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="mt-3 px-1 text-[12.5px] text-graphite">Off-plan — rental distributions begin after handover.</Text>
              )}
            </View>
          ) : null}

          {/* LEDGER */}
          {tab === 'ledger' ? (
            <View>
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-[13px] font-semibold text-ink">On-chain activity</Text>
                <Pressable onPress={() => router.push('/shares/ledger')} className="flex-row items-center gap-1"><Text className="text-[12.5px] font-medium text-accent">Full ledger</Text><ExternalLink size={13} color={colors.accent} /></Pressable>
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
      <View style={{ paddingBottom: insets.bottom + 10 }} className="absolute inset-x-0 bottom-0 border-t border-hairline/50 bg-white/90 px-4 pt-2.5">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-[12px] text-graphite">Price / share <Text className="font-semibold text-ink">{formatAed(price)}</Text></Text>
          {asset.discountPct > 0 ? <DiscountBadge pct={asset.discountPct} /> : null}
        </View>
        <View className="flex-row gap-3">
          {funded ? (
            <Pressable onPress={() => router.push(`/shares/market?symbol=${asset.symbol}`)} className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-accent py-3.5">
              <ArrowLeftRight size={17} color="#fff" /><Text className="text-[15px] font-semibold text-white">Trade on secondary market</Text>
            </Pressable>
          ) : (
            <>
              <Pressable onPress={() => router.push(`/shares/market?symbol=${asset.symbol}`)} className="flex-row items-center justify-center gap-1.5 rounded-full border border-hairline bg-white px-5 py-3.5">
                <ArrowLeftRight size={16} color={colors.ink} /><Text className="text-[14px] font-semibold text-ink">Trade</Text>
              </Pressable>
              <Pressable onPress={() => startInvest('buy')} className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-accent py-3.5">
                <Coins size={17} color="#fff" /><Text className="text-[15px] font-semibold text-white">Invest now</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function Spec({ icon: Icon, label, cap }: { icon: typeof Bed; label: string; cap?: boolean }) {
  return (
    <View className="w-1/2 flex-row items-center gap-2">
      <Icon size={17} color={colors.accent} />
      <Text className={`text-[14px] text-ink700 ${cap ? 'capitalize' : ''}`}>{label}</Text>
    </View>
  );
}

function FeeRow({ label, value, strike, bold }: { label: string; value: string; strike?: string; bold?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className={`text-[13px] ${bold ? 'font-semibold text-ink' : 'text-graphite'}`}>{label}</Text>
      <View className="flex-row items-baseline gap-1.5">
        {strike ? <Text className="text-[11px] text-graphiteLight line-through">{strike}</Text> : null}
        <Text className={`text-[13.5px] ${bold ? 'font-semibold' : 'font-medium'} text-ink`}>{value}</Text>
      </View>
    </View>
  );
}

function LedgerRow({ e }: { e: ShareLedgerEntry }) {
  const tint: Record<string, string> = { buy: '#0071e3', sell: '#b45309', dividend: '#059669', transfer: '#7c3aed', deposit: '#6e6e73' };
  return (
    <View className="mb-2 flex-row items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-3.5 py-3">
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <View style={{ backgroundColor: `${tint[e.type]}1A` }} className="rounded-full px-2 py-0.5"><Text style={{ color: tint[e.type] }} className="text-[10.5px] font-semibold uppercase">{e.type}</Text></View>
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
