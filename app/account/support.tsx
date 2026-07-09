import { View, Text, ScrollView, Linking } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Phone, MessageCircle, Send, Mail, ChevronRight } from 'lucide-react-native';
import { GlassBg } from '@/components/Glass';
import { Press, FadeIn } from '@/components/Press';
import { useAppSettings, whatsappLink, telLink, telegramLink } from '@/lib/settings';
import { colors } from '@/theme/tokens';

type Row = { key: string; icon: typeof Phone; label: string; sub: string; url: string };

export default function Support() {
  const insets = useSafeAreaInsets();
  const settings = useAppSettings();
  const telegram = telegramLink(settings);

  const rows: Row[] = [
    { key: 'call', icon: Phone, label: 'Call us', sub: settings.call_number, url: telLink(settings) },
    { key: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', sub: 'Chat with our team', url: whatsappLink(settings) },
    ...(telegram ? [{ key: 'telegram', icon: Send, label: 'Telegram', sub: `@${settings.telegram_username?.replace(/^@/, '')}`, url: telegram }] : []),
    { key: 'email', icon: Mail, label: 'Email', sub: settings.support_email, url: `mailto:${settings.support_email}` },
  ];

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center gap-2 px-4 pb-2">
        <Press onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-surface2">
          <ArrowLeft size={20} color={colors.ink} />
        </Press>
        <Text className="flex-1 text-[17px] font-semibold text-ink">Contact us</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
        <Text className="mb-4 text-[13.5px] text-graphite">Need a hand? Reach our team however suits you best.</Text>
        <View className="gap-2.5">
          {rows.map((r, i) => {
            const Icon = r.icon;
            return (
              <FadeIn key={r.key} delay={i * 40}>
                <Press onPress={() => Linking.openURL(r.url)} className="flex-row items-center gap-3.5 rounded-apple border border-hairline bg-surface px-4 py-4">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-surface2"><Icon size={20} color={colors.accent} /></View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-semibold text-ink">{r.label}</Text>
                    <Text className="text-[12.5px] text-graphite" numberOfLines={1}>{r.sub}</Text>
                  </View>
                  <ChevronRight size={19} color={colors.graphiteLight} />
                </Press>
              </FadeIn>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
