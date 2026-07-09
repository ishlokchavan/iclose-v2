import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { GlassBg } from '@/components/Glass';
import { Wordmark } from '@/components/DealUI';
import { Press } from '@/components/Press';
import { colors } from '@/theme/tokens';

const LAST_UPDATED = 'July 2026';

export default function Privacy() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-paper">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center justify-between px-4 pb-2">
        <Wordmark size={20} />
        <Press onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-full bg-surface2"><X size={20} color={colors.ink} /></Press>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
        <View className="rounded-apple border border-hairline bg-surface p-5">
          <Text className="text-[24px] font-bold text-ink">Privacy Policy</Text>
          <Text className="mt-1 text-[12.5px] text-graphite-light">Last updated: {LAST_UPDATED}</Text>

          <P>
            This Privacy Policy explains how iClose (iclose.ae), a UAE real-estate
            deal-closing platform, collects, uses, and protects your information when
            you use our app and services. By using iClose, you agree to the practices
            described here.
          </P>

          <H>1. Information we collect</H>
          <P>
            We collect the details you give us and the information needed to help close
            your deals, including:
          </P>
          <Bullet>Your name, email address, and phone number.</Bullet>
          <Bullet>Your role (buyer, seller, or broker) and preferred contact channel.</Bullet>
          <Bullet>Deal and inquiry details — property, location, budget, deal value, and notes you submit.</Bullet>
          <Bullet>Identity documents you choose to upload, such as your Emirates ID or passport.</Bullet>
          <Bullet>Bank details you optionally provide for commission payouts (IBAN, bank name, account holder).</Bullet>
          <Bullet>Basic technical data needed to operate the app, such as authentication tokens.</Bullet>

          <H>2. How we use your information</H>
          <P>
            We use your information to create and manage your account, process and track
            your inquiries and deals, verify your identity, arrange commission payouts,
            provide customer support, and communicate with you about your deals. We do not
            sell your personal data.
          </P>

          <H>3. Where your data is stored</H>
          <P>
            Your data is stored securely using Supabase, our database and authentication
            provider. Uploaded documents are kept in private storage with access controlled
            by row-level security, so only you and authorised iClose team members can access
            them.
          </P>

          <H>4. Third parties</H>
          <P>
            To deliver the service we rely on a limited set of trusted providers:
          </P>
          <Bullet>WhatsApp — used to share your inquiry details and communicate with our team when you choose to.</Bullet>
          <Bullet>Brevo — used to send transactional and service emails.</Bullet>
          <Bullet>Supabase — used for database, authentication, and document storage.</Bullet>
          <P>
            These providers process data only as needed to provide their service to us.
          </P>

          <H>5. Your rights</H>
          <P>
            You can access and update your personal details at any time from your account
            screen. You may request a copy of your data or ask us to correct it by
            contacting us. You control which documents you upload and can replace them at
            any time.
          </P>

          <H>6. Account deletion</H>
          <P>
            You can delete your iClose account at any time from the account screen. Deleting
            your account permanently removes your profile and inquiries. Some records may be
            retained where required to comply with legal or regulatory obligations.
          </P>

          <H>7. Contact us</H>
          <P>
            For any privacy questions or requests, email us at hello@iclose.ae.
          </P>

          <Text className="mt-6 text-[12px] leading-relaxed text-graphite-light">
            This document is provided for general information only and is not legal advice.
            It is governed by the laws of the United Arab Emirates.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <Text className="mt-5 text-[16px] font-semibold text-ink">{children}</Text>;
}
function P({ children }: { children: React.ReactNode }) {
  return <Text className="mt-2 text-[14px] leading-relaxed text-graphite">{children}</Text>;
}
function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View className="mt-2 flex-row gap-2 pl-1">
      <Text className="text-[14px] leading-relaxed" style={{ color: colors.accent }}>•</Text>
      <Text className="flex-1 text-[14px] leading-relaxed text-graphite">{children}</Text>
    </View>
  );
}
