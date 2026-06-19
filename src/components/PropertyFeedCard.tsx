import { View, Text, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, BedDouble, Bath, Maximize, BadgeCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { CreditBadge } from './CreditBadge';
import { aed, bedLabel } from '@/lib/format';
import { useSaved } from '@/store/saved';
import type { ExperienceListing } from '@/types/listing';

const { height } = Dimensions.get('window');

/**
 * Full-bleed, full-screen property card — the Instagram/TikTok-style feed
 * unit. Snap-pages vertically in the Home feed. Tap to open the detail.
 */
export function PropertyFeedCard({ listing, tabBarSpace = 96 }: { listing: ExperienceListing; tabBarSpace?: number }) {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(listing.reference);

  return (
    <Pressable
      style={{ height }}
      onPress={() => router.push(`/property/${listing.reference}`)}
      className="relative w-full bg-ink"
    >
      <Image
        source={{ uri: listing.cover }}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
        contentFit="cover"
        transition={250}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.78)']}
        locations={[0, 0.45, 1]}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      {/* Save */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          toggle(listing.reference);
        }}
        className="absolute right-4 top-16 h-12 w-12 items-center justify-center rounded-full bg-black/30"
        hitSlop={10}
      >
        <Heart size={24} color="#ffffff" fill={saved ? '#ff4d6d' : 'transparent'} />
      </Pressable>

      {/* Content */}
      <View className="absolute inset-x-0 bottom-0 gap-3 px-5" style={{ paddingBottom: tabBarSpace }}>
        <CreditBadge award={listing.credit} />

        <Text className="text-2xl font-semibold leading-tight text-white" numberOfLines={2}>
          {listing.title}
        </Text>

        <View className="flex-row items-center gap-2">
          <Text className="text-base text-white/90">{listing.community}</Text>
          {listing.isVerified ? <BadgeCheck size={16} color="#9effe0" /> : null}
          {listing.completion === 'off_plan' ? (
            <View className="rounded-full bg-journey-offplan/90 px-2 py-0.5">
              <Text className="text-[11px] font-semibold text-ink">Off-plan</Text>
            </View>
          ) : null}
        </View>

        <Text className="text-3xl font-bold text-white">{aed(listing.priceAed)}</Text>

        <Text className="text-sm text-white/80" numberOfLines={1}>{listing.hook}</Text>

        <View className="mt-1 flex-row items-center gap-5">
          <Spec icon={<BedDouble size={16} color="#ffffff" />} label={bedLabel(listing.bedrooms)} />
          <Spec icon={<Bath size={16} color="#ffffff" />} label={`${listing.bathrooms ?? '—'}`} />
          <Spec icon={<Maximize size={16} color="#ffffff" />} label={`${listing.areaSqft ?? '—'} sqft`} />
        </View>
      </View>
    </Pressable>
  );
}

function Spec({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {icon}
      <Text className="text-sm font-medium text-white">{label}</Text>
    </View>
  );
}
