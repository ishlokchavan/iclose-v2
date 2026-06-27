import { useState } from 'react';
import { Text, Pressable, Modal, View } from 'react-native';
import { X, HelpCircle } from 'lucide-react-native';
import { colors } from '@/theme/tokens';

/** Plain-English glossary — one friendly sentence per term, no jargon. */
export const GLOSSARY: Record<string, { title: string; body: string }> = {
  shares: { title: 'Property shares', body: 'A property is split into many small, equal pieces. Buy a few and you own that share of the home — just like owning part of it on paper.' },
  rent: { title: 'Monthly rent', body: 'The home is rented out. Each month the rent is split between everyone who owns a share — your cut lands in your wallet.' },
  yield: { title: 'Rental yield', body: 'How much rent you earn in a year compared with what you put in. A 7% yield means about AED 70 a year for every AED 1,000 invested.' },
  appreciation: { title: 'Value growth', body: 'If the property becomes worth more over time, your shares are worth more too. This is the “could be worth more later” part.' },
  distribution: { title: 'Distribution', body: 'Just a fancy word for your share of the rent being paid out to you.' },
  custodian: { title: 'Custodian', body: 'A licensed company that safely holds the property’s title on behalf of all the shareholders — so your ownership is protected.' },
  secondary: { title: 'Secondary market', body: 'A place to sell your shares to other investors (or buy theirs) whenever you want, instead of waiting.' },
  deed: { title: 'Tokenized title deed', body: 'The official ownership document, registered with the Dubai Land Department and split so shares can be owned digitally.' },
  kyc: { title: 'Verification (KYC)', body: 'A quick identity check that regulated platforms must do before you invest. Takes under a minute.' },
};

/**
 * Inline term with a dotted underline + help dot. Tap to read a one-sentence,
 * plain-English explanation. Self-contained (own modal), so it can be dropped
 * anywhere text appears.
 */
export function Term({ k, children }: { k: keyof typeof GLOSSARY | string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const entry = GLOSSARY[k];
  if (!entry) return <>{children}</>;
  return (
    <>
      <Text onPress={() => setOpen(true)} className="font-medium text-accent" style={{ textDecorationLine: 'underline', textDecorationStyle: 'dotted' }}>
        {children}
      </Text>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} className="flex-1 justify-end bg-black/40">
          <Pressable onPress={(e) => e.stopPropagation()} className="rounded-t-[28px] bg-white px-5 pb-10 pt-5">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <HelpCircle size={18} color={colors.accent} />
                <Text className="text-[17px] font-semibold text-ink">{entry.title}</Text>
              </View>
              <Pressable onPress={() => setOpen(false)} className="h-9 w-9 items-center justify-center rounded-full bg-black/5">
                <X size={18} color={colors.ink} />
              </Pressable>
            </View>
            <Text className="text-[14.5px] leading-6 text-graphite">{entry.body}</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
