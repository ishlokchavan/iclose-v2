import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { X, Home, CheckCircle2 } from 'lucide-react-native';
import { api, type ListingDraft } from '@/lib/api';
import { GlassBg } from '@/components/Glass';
import { colors } from '@/theme/tokens';

const PROPERTY_TYPES = ['apartment', 'villa', 'townhouse', 'penthouse', 'plot', 'office'];

/** List-your-property flow (modal) — submits a draft to /api/listing. */
export default function SellScreen() {
  const insets = useSafeAreaInsets();
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState<'sale' | 'rent'>('sale');
  const [propertyType, setPropertyType] = useState('apartment');
  const [community, setCommunity] = useState('');
  const [city, setCity] = useState('Dubai');
  const [price, setPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [area, setArea] = useState('');
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  async function submit() {
    if (!title.trim() || !community.trim() || !price.trim() || !contactName.trim() || !contactPhone.trim()) {
      Alert.alert('Missing details', 'Add at least a title, community, price, your name and phone.');
      return;
    }
    const draft: ListingDraft = {
      title: title.trim(),
      purpose,
      propertyType,
      community: community.trim(),
      city: city.trim() || 'Dubai',
      priceAed: Number(price.replace(/[^0-9]/g, '')) || 0,
      bedrooms: bedrooms ? Number(bedrooms) : null,
      bathrooms: bathrooms ? Number(bathrooms) : null,
      areaSqft: area ? Number(area.replace(/[^0-9]/g, '')) : null,
      description: description.trim(),
      contactName: contactName.trim(),
      contactPhone: contactPhone.trim(),
    };
    setBusy(true);
    try {
      await api.createListing(draft).catch(() => {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <View className="flex-1 items-center justify-center px-8" style={{ paddingTop: insets.top }}><GlassBg />
        <View className="h-20 w-20 items-center justify-center rounded-full bg-journey-listing/30">
          <CheckCircle2 size={40} color={colors.accent} />
        </View>
        <Text className="mt-5 text-center text-2xl font-bold text-ink">Listing submitted</Text>
        <Text className="mt-2 text-center text-base text-graphite">
          Our team will verify the details and publish your home — commission-free.
        </Text>
        <Pressable onPress={() => router.back()} className="mt-8 w-full rounded-apple bg-ink py-4">
          <Text className="text-center font-semibold text-white">Done</Text>
        </Pressable>
      </View>
    );
  }

  if (!started) {
    return (
      <View className="flex-1" style={{ paddingTop: insets.top + 8 }}><GlassBg />
        <View className="flex-row justify-end px-5">
          <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/70">
            <X size={20} color={colors.ink} />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-journey-listing/30">
            <Home size={30} color={colors.ink} />
          </View>
          <Text className="text-center text-2xl font-bold text-ink">List your home, commission-free</Text>
          <Text className="text-center text-base text-graphite">
            Sellers keep what they'd normally pay an agent. Add a few details and we'll handle the rest.
          </Text>
          <Pressable onPress={() => setStarted(true)} className="mt-2 w-full rounded-apple bg-ink py-4">
            <Text className="text-center font-semibold text-white">Start a listing</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}><GlassBg />
      <View className="flex-row items-center justify-between px-5 pb-2" style={{ paddingTop: insets.top + 8 }}>
        <Text className="text-2xl font-bold text-ink">New listing</Text>
        <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/70">
          <X size={20} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <Field label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Bright 2BR with Marina view" />

        <Text className="mb-1.5 text-sm font-medium text-graphite">Purpose</Text>
        <View className="mb-4 flex-row gap-2">
          {(['sale', 'rent'] as const).map((p) => (
            <Chip key={p} label={p === 'sale' ? 'For sale' : 'For rent'} active={purpose === p} onPress={() => setPurpose(p)} />
          ))}
        </View>

        <Text className="mb-1.5 text-sm font-medium text-graphite">Property type</Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {PROPERTY_TYPES.map((t) => (
            <Chip key={t} label={t[0].toUpperCase() + t.slice(1)} active={propertyType === t} onPress={() => setPropertyType(t)} />
          ))}
        </View>

        <Field label="Community" value={community} onChangeText={setCommunity} placeholder="e.g. Dubai Marina" />
        <Field label="City" value={city} onChangeText={setCity} placeholder="Dubai" />
        <Field label="Price (AED)" value={price} onChangeText={setPrice} placeholder="2650000" keyboardType="number-pad" />

        <View className="flex-row gap-3">
          <View className="flex-1"><Field label="Bedrooms" value={bedrooms} onChangeText={setBedrooms} placeholder="2" keyboardType="number-pad" /></View>
          <View className="flex-1"><Field label="Bathrooms" value={bathrooms} onChangeText={setBathrooms} placeholder="2" keyboardType="number-pad" /></View>
        </View>
        <Field label="Area (sqft)" value={area} onChangeText={setArea} placeholder="1180" keyboardType="number-pad" />

        <Text className="mb-1.5 text-sm font-medium text-graphite">Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Tell buyers what makes it special"
          placeholderTextColor={colors.graphiteLight}
          className="mb-4 min-h-[96px] rounded-apple border border-white/60 bg-white/70 px-4 py-3 text-base text-ink"
          style={{ textAlignVertical: 'top' }}
        />

        <Field label="Your name" value={contactName} onChangeText={setContactName} placeholder="Full name" />
        <Field label="Your phone" value={contactPhone} onChangeText={setContactPhone} placeholder="+971 50 000 0000" keyboardType="phone-pad" />

        <Pressable disabled={busy} onPress={submit} className="mt-4 flex-row items-center justify-center gap-2 rounded-apple bg-accent py-4">
          {busy ? <ActivityIndicator color="#fff" /> : null}
          <Text className="text-center text-base font-semibold text-white">{busy ? 'Submitting…' : 'Submit listing'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm font-medium text-graphite">{label}</Text>
      <TextInput
        placeholderTextColor={colors.graphiteLight}
        className="rounded-apple border border-white/60 bg-white/70 px-4 py-3.5 text-base text-ink"
        {...props}
      />
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-4 py-2 ${active ? 'border-ink bg-ink' : 'border-white/60 bg-white/70'}`}
    >
      <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-ink'}`}>{label}</Text>
    </Pressable>
  );
}
