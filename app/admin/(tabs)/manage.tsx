import { View, Text, ScrollView } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserCog, HelpCircle, Settings, Mail, History, ChevronRight, type LucideIcon } from 'lucide-react-native';
import { GlassBg } from '@/components/Glass';
import { Press, FadeIn } from '@/components/Press';
import { colors } from '@/theme/tokens';

/**
 * Manage tab — the hub for everything that isn't a daily-driver section:
 * team, help content, global settings and the logs.
 */
const SECTIONS: { label: string; sub: string; href: Href; Icon: LucideIcon }[] = [
  { label: 'Account managers', sub: 'The team users can reach', href: '/admin/managers', Icon: UserCog },
  { label: 'FAQs', sub: 'Help content by audience', href: '/admin/faqs', Icon: HelpCircle },
  { label: 'Global settings', sub: 'Contact channels & support email', href: '/admin/settings', Icon: Settings },
  { label: 'Email log', sub: 'Outbox & delivery status', href: '/admin/emails', Icon: Mail },
  { label: 'Audit trail', sub: 'Every change, who and when', href: '/admin/audit', Icon: History },
];

export default function AdminManage() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1">
      <GlassBg />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: insets.bottom + 110 }}
      >
        <Text className="text-[26px] font-semibold text-ink">Manage</Text>
        <Text className="mb-5 text-[14.5px] text-graphite">Content, team and console housekeeping.</Text>

        <View className="gap-2.5">
          {SECTIONS.map((sec, i) => (
            <FadeIn key={sec.label} delay={i * 40}>
              <Press
                onPress={() => router.push(sec.href)}
                className="flex-row items-center gap-3 rounded-apple border border-hairline bg-surface p-3.5"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-surface2">
                  <sec.Icon size={19} color={colors.accent} />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-ink">{sec.label}</Text>
                  <Text className="text-[12.5px] text-graphite">{sec.sub}</Text>
                </View>
                <ChevronRight size={18} color={colors.graphiteLight} />
              </Press>
            </FadeIn>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
