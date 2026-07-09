import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { GlassBg } from '@/components/Glass';
import { Wordmark } from '@/components/DealUI';
import { Press } from '@/components/Press';
import { colors } from '@/theme/tokens';

const LAST_UPDATED = 'July 2026';

export default function Terms() {
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
          <Text className="text-[24px] font-bold text-ink">Terms of Use</Text>
          <Text className="mt-1 text-[12.5px] text-graphite-light">Last updated: {LAST_UPDATED}</Text>

          <P>
            These Terms of Use govern your access to and use of iClose (iclose.ae), a UAE
            real-estate deal-closing platform. By creating an account or using the app, you
            agree to these terms.
          </P>

          <H>1. What iClose does</H>
          <P>
            iClose helps buyers, sellers, and brokers submit inquiries and close real-estate
            deals in the UAE for a flat fee instead of a traditional commission. We
            facilitate and coordinate deals; we are not a party to any sale, purchase, or
            brokerage contract between you and a third party.
          </P>

          <H>2. Your account</H>
          <P>
            You must provide accurate information and keep your account details up to date.
            You are responsible for activity under your account and for keeping your login
            credentials secure. You must be legally able to enter into contracts in the UAE
            to use iClose.
          </P>

          <H>3. Submitting inquiries and documents</H>
          <P>
            When you submit an inquiry or upload documents such as your Emirates ID,
            passport, or bank details, you confirm the information is accurate and that you
            have the right to share it. You choose when to share inquiry details with our
            team, including via WhatsApp.
          </P>

          <H>4. Fees</H>
          <P>
            iClose charges flat fees rather than commission — for example an admin fee for
            brokers and a conveyance or transfer fee for buyers and sellers. Applicable fees
            are shown in the app. Government fees, third-party charges, and taxes are your
            responsibility unless stated otherwise.
          </P>

          <H>5. No professional advice</H>
          <P>
            Information provided in the app, including any estimates of commission, savings,
            or payouts, is for general guidance only. It is not legal, financial, or tax
            advice. You should obtain independent professional advice before making any
            decision.
          </P>

          <H>6. Acceptable use</H>
          <P>
            You agree not to misuse the platform, submit false or fraudulent information,
            infringe the rights of others, or use iClose for any unlawful purpose. We may
            suspend or terminate accounts that breach these terms.
          </P>

          <H>7. Availability and changes</H>
          <P>
            We may update, suspend, or discontinue features of the app at any time. We may
            also update these terms from time to time; continued use of iClose after changes
            means you accept the updated terms.
          </P>

          <H>8. Liability</H>
          <P>
            iClose is provided on an "as is" basis. To the fullest extent permitted by law,
            we are not liable for indirect or consequential losses, or for the acts of third
            parties involved in your deal.
          </P>

          <H>9. Account deletion</H>
          <P>
            You may delete your account at any time from the account screen. On deletion, we
            remove your profile and inquiries, subject to any records we must keep by law.
          </P>

          <H>10. Contact us</H>
          <P>
            Questions about these terms? Email us at hello@iclose.ae.
          </P>

          <Text className="mt-6 text-[12px] leading-relaxed text-graphite-light">
            This document is provided for general information only and is not legal advice.
            These terms are governed by the laws of the United Arab Emirates.
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
