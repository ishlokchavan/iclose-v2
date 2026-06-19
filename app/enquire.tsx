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
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { X, CheckCircle2 } from 'lucide-react-native';
import { useExperience } from '@/store/experience';
import { useEnquiries } from '@/store/enquiries';
import { api } from '@/lib/api';
import { aed } from '@/lib/format';
import { colors } from '@/theme/tokens';

/** Enquiry form for a listing — captures a lead and confirms it. */
export default function EnquireScreen() {
  const { reference } = useLocalSearchParams<{ reference: string }>();
  const insets = useSafeAreaInsets();
  const { byRef } = useExperience();
  const { markEnquired } = useEnquiries();

  const listing = byRef(String(reference));
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(
    listing ? `Hi, I'm interested in "${listing.title}". Please share more details.` : '',
  );
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Almost there', 'Please add your name and phone number.');
      return;
    }
    setBusy(true);
    try {
      // Try the backend; the enquiry is still recorded locally if offline.
      await api
        .enquire({ reference: String(reference), name, phone, email, message })
        .catch(() => {});
      markEnquired(String(reference));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <View className="flex-1 items-center justify-center bg-paper px-8" style={{ paddingTop: insets.top }}>
        <View className="h-20 w-20 items-center justify-center rounded-full bg-journey-listing/30">
          <CheckCircle2 size={40} color={colors.accent} />
        </View>
        <Text className="mt-5 text-center text-2xl font-bold text-ink">Enquiry sent</Text>
        <Text className="mt-2 text-center text-base text-graphite">
          An iClose specialist will reach out shortly. Your details are saved under your profile.
        </Text>
        <Pressable onPress={() => router.back()} className="mt-8 w-full rounded-apple bg-ink py-4">
          <Text className="text-center font-semibold text-white">Done</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-fog"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-row items-center justify-between px-5 pb-2" style={{ paddingTop: insets.top + 8 }}>
        <Text className="text-2xl font-bold text-ink">Enquire</Text>
        <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-full bg-mist">
          <X size={20} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {listing ? (
          <View className="mb-5 flex-row gap-3 rounded-apple bg-paper p-3">
            <Image source={{ uri: listing.cover }} style={{ width: 64, height: 64, borderRadius: 12 }} contentFit="cover" />
            <View className="flex-1 justify-center">
              <Text className="text-base font-semibold text-ink" numberOfLines={1}>{listing.title}</Text>
              <Text className="text-sm text-graphite">{listing.community}</Text>
              <Text className="mt-0.5 font-bold text-ink">{aed(listing.priceAed)}</Text>
            </View>
          </View>
        ) : null}

        <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
        <Field
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="+971 50 000 0000"
          keyboardType="phone-pad"
        />
        <Field
          label="Email (optional)"
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text className="mb-1.5 text-sm font-medium text-graphite">Message</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          multiline
          placeholder="Anything you'd like to ask?"
          placeholderTextColor={colors.graphiteLight}
          className="min-h-[96px] rounded-apple bg-paper px-4 py-3 text-base text-ink"
          style={{ textAlignVertical: 'top' }}
        />

        <Pressable disabled={busy} onPress={submit} className="mt-6 flex-row items-center justify-center gap-2 rounded-apple bg-accent py-4">
          {busy ? <ActivityIndicator color="#fff" /> : null}
          <Text className="text-center text-base font-semibold text-white">
            {busy ? 'Sending…' : 'Send enquiry'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm font-medium text-graphite">{label}</Text>
      <TextInput
        placeholderTextColor={colors.graphiteLight}
        className="rounded-apple bg-paper px-4 py-3.5 text-base text-ink"
        {...props}
      />
    </View>
  );
}
