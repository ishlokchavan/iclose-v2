import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Heart, BedDouble, Bath, Maximize, MapPin, BadgeCheck, Sparkles } from 'lucide-react-native';
import { useExperience } from '@/store/experience';
import { useSaved } from '@/store/saved';
import { useEnquiries } from '@/store/enquiries';
import { CreditBadge } from '@/components/CreditBadge';
import { Loading } from '@/components/Loading';
import { aed, bedLabel } from '@/lib/format';
import { api } from '@/lib/api';
import { colors } from '@/theme/tokens';

const { width } = Dimensions.get('window');

export default function PropertyScreen() {
  const { reference } = useLocalSearchParams<{ reference: string }>();
  const { byRef } = useExperience();
  const { isSaved, toggle } = useSaved();
  const { hasEnquired } = useEnquiries();
  const insets = useSafeAreaInsets();
  const [why, setWhy] = useState<string | null>(null);
  const [whyBusy, setWhyBusy] = useState(false);

  const listing = byRef(String(reference));
  if (!listing) return <Loading />;
  const gallery = listing.images?.length ? listing.images : [listing.cover];
  const saved = isSaved(listing.reference);
  const enquired = hasEnquired(listing.reference);

  async function explain() {
    setWhyBusy(true);
    try {
      const { reason } = await api.why(listing!.reference);
      setWhy(reason);
    } catch {
      setWhy('This home matches your budget and the communities you’ve been exploring.');
    } finally {
      setWhyBusy(false);
    }
  }

  return (
    <View className="flex-1 bg-paper">
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        <View>
          <FlatList
            data={gallery}
            keyExtractor={(u, i) => `${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={{ width, height: width * 1.1 }} contentFit="cover" transition={200} />
            )}
          />
          <Pressable onPress={() => router.back()} style={{ top: insets.top + 8 }}
            className="absolute left-4 h-11 w-11 items-center justify-center rounded-full bg-black/35">
            <ChevronLeft size={26} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggle(listing.reference); }}
            style={{ top: insets.top + 8 }} className="absolute right-4 h-11 w-11 items-center justify-center rounded-full bg-black/35">
            <Heart size={22} color="#fff" fill={saved ? '#ff4d6d' : 'transparent'} />
          </Pressable>
        </View>

        <View className="gap-4 px-5 pt-5">
          <CreditBadge award={listing.credit} large />
          <Text className="text-2xl font-bold text-ink">{listing.title}</Text>

          <View className="flex-row items-center gap-1.5">
            <MapPin size={16} color={colors.graphite} />
            <Text className="text-base text-graphite">{listing.community}, {listing.city}</Text>
            {listing.isVerified ? <BadgeCheck size={16} color={colors.accent} /> : null}
          </View>

          <Text className="text-3xl font-bold text-ink">{aed(listing.priceAed)}</Text>

          <View className="flex-row justify-between rounded-apple bg-fog p-4">
            <Fact icon={<BedDouble size={20} color={colors.ink} />} label={bedLabel(listing.bedrooms)} />
            <Fact icon={<Bath size={20} color={colors.ink} />} label={`${listing.bathrooms ?? '—'} Bath`} />
            <Fact icon={<Maximize size={20} color={colors.ink} />} label={`${listing.areaSqft ?? '—'} sqft`} />
          </View>

          {/* AI "why this fits" — calls /api/glass/why */}
          <Pressable onPress={explain} disabled={whyBusy} className="flex-row items-center gap-2 rounded-apple border border-accent/30 bg-accent/5 p-4">
            <Sparkles size={18} color={colors.accent} />
            <Text className="flex-1 text-accent">{why ?? (whyBusy ? 'Thinking…' : 'Why does this fit me?')}</Text>
          </Pressable>

          {listing.developerName ? (
            <Text className="text-sm text-graphite">Developer · {listing.developerName}{listing.completion === 'off_plan' ? ' · Off-plan' : ''}</Text>
          ) : null}

          {listing.description ? <Text className="text-base leading-6 text-ink700">{listing.description}</Text> : null}

          {listing.amenities?.length ? (
            <View className="flex-row flex-wrap gap-2 pt-1">
              {listing.amenities.map((a) => (
                <View key={a} className="rounded-full bg-mist px-3 py-1.5"><Text className="text-sm text-ink700">{a}</Text></View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={{ paddingBottom: insets.bottom + 12 }} className="absolute inset-x-0 bottom-0 border-t border-hairline bg-paper/95 px-5 pt-3">
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push(`/enquire?reference=${listing.reference}`);
          }}
          className="rounded-apple bg-ink py-4"
        >
          <Text className="text-center text-base font-semibold text-white">
            {enquired
              ? 'Enquiry sent — ask again'
              : `Enquire — claim ${listing.credit.credits.toLocaleString()} credits`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Fact({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <View className="items-center gap-1">{icon}<Text className="text-sm font-medium text-ink">{label}</Text></View>;
}
