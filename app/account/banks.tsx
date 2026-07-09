import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert, ActivityIndicator, Modal, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Trash2, Landmark, X, Check, Star, Pencil } from 'lucide-react-native';
import { GlassBg } from '@/components/Glass';
import { Press, FadeIn } from '@/components/Press';
import { listBankAccounts, addBankAccount, updateBankAccount, setPrimaryBank, deleteBankAccount, type BankAccount } from '@/lib/profile-data';
import { validateIban, formatIban } from '@/lib/profile-uploads';
import { colors } from '@/theme/tokens';

const DANGER = '#ff453a';

function maskIban(raw: string): string {
  const s = raw.replace(/\s+/g, '').toUpperCase();
  if (s.length <= 8) return formatIban(s);
  const masked = s.slice(0, 4) + '•'.repeat(s.length - 8) + s.slice(-4);
  return masked.replace(/(.{4})/g, '$1 ').trim();
}

export default function Banks() {
  const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BankAccount | null | undefined>(undefined); // undefined = closed, null = new

  const load = useCallback(async () => { setAccounts(await listBankAccounts()); }, []);
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  function confirmDelete(acc: BankAccount) {
    Alert.alert('Delete bank account', 'This removes the payout account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteBankAccount(acc.id); await load(); } catch (e) { Alert.alert('Could not delete', (e as Error).message); }
      } },
    ]);
  }

  async function makePrimary(acc: BankAccount) {
    try { await setPrimaryBank(acc.id); await load(); } catch (e) { Alert.alert('Could not update', (e as Error).message); }
  }

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center gap-2 px-4 pb-2">
        <Press onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-surface2">
          <ArrowLeft size={20} color={colors.ink} />
        </Press>
        <Text className="flex-1 text-[17px] font-semibold text-ink">Bank accounts</Text>
      </View>

      {loading ? (
        <ActivityIndicator className="mt-20" color={colors.accent} />
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
          {accounts.length === 0 ? (
            <View className="mt-16 items-center gap-3 px-8">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-surface2"><Landmark size={28} color={colors.graphite} /></View>
              <Text className="text-center text-[15px] text-graphite">No bank accounts yet. Add one to receive your commission payouts.</Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {accounts.map((acc, i) => (
                <FadeIn key={acc.id} delay={Math.min(i, 10) * 30}>
                  <View className="rounded-apple border border-hairline bg-surface p-4">
                    <View className="mb-1 flex-row items-center gap-2">
                      <Text className="flex-1 text-[15.5px] font-semibold text-ink" numberOfLines={1}>{acc.bank_name || 'Bank account'}</Text>
                      {acc.is_primary ? (
                        <View className="flex-row items-center gap-1 rounded-full bg-accent px-2 py-0.5">
                          <Star size={11} color={colors.onAccent} fill={colors.onAccent} />
                          <Text className="text-[11px] font-bold" style={{ color: colors.onAccent }}>Primary</Text>
                        </View>
                      ) : null}
                    </View>
                    {acc.account_name ? <Text className="text-[13px] text-graphite">{acc.account_name}</Text> : null}
                    <Text className="mt-1 text-[13.5px] tracking-wide text-ink800">{maskIban(acc.iban)}</Text>
                    <View className="mt-3 flex-row gap-2">
                      {!acc.is_primary ? (
                        <Press onPress={() => makePrimary(acc)} className="flex-row items-center gap-1.5 rounded-full border border-hairline bg-surface2 px-3 py-2">
                          <Star size={14} color={colors.accent} /><Text className="text-[12.5px] font-semibold text-ink">Set primary</Text>
                        </Press>
                      ) : null}
                      <Press onPress={() => setEditing(acc)} className="flex-row items-center gap-1.5 rounded-full border border-hairline bg-surface2 px-3 py-2">
                        <Pencil size={14} color={colors.ink} /><Text className="text-[12.5px] font-semibold text-ink">Edit</Text>
                      </Press>
                      <Press onPress={() => confirmDelete(acc)} className="flex-row items-center gap-1.5 rounded-full bg-surface2 px-3 py-2" style={{ borderWidth: 1, borderColor: 'rgba(255,69,58,0.4)' }}>
                        <Trash2 size={14} color={DANGER} /><Text className="text-[12.5px] font-semibold" style={{ color: DANGER }}>Delete</Text>
                      </Press>
                    </View>
                  </View>
                </FadeIn>
              ))}
            </View>
          )}

          <Press onPress={() => setEditing(null)} className="mt-5 h-[52px] flex-row items-center justify-center gap-2 rounded-full bg-accent">
            <Plus size={18} color={colors.onAccent} /><Text className="text-[15px] font-semibold" style={{ color: colors.onAccent }}>Add bank account</Text>
          </Press>
        </ScrollView>
      )}

      {editing !== undefined ? (
        <BankForm
          account={editing}
          onClose={() => setEditing(undefined)}
          onSaved={async () => { setEditing(undefined); await load(); }}
        />
      ) : null}
    </View>
  );
}

function BankForm({ account, onClose, onSaved }: { account: BankAccount | null; onClose: () => void; onSaved: () => void }) {
  const insets = useSafeAreaInsets();
  const [iban, setIban] = useState(account?.iban ?? '');
  const [bankName, setBankName] = useState(account?.bank_name ?? '');
  const [accountName, setAccountName] = useState(account?.account_name ?? '');
  const [primary, setPrimary] = useState(account?.is_primary ?? false);
  const [busy, setBusy] = useState(false);

  const ibanCheck = iban.trim() ? validateIban(iban) : null;

  async function save() {
    const clean = iban.replace(/\s+/g, '').toUpperCase();
    if (!validateIban(clean).valid) return Alert.alert('Invalid IBAN', 'Enter a valid UAE IBAN.');
    setBusy(true);
    try {
      if (account) await updateBankAccount(account.id, { iban: clean, bank_name: bankName.trim() || null, account_name: accountName.trim() || null, is_primary: primary });
      else await addBankAccount({ iban: clean, bank_name: bankName.trim() || null, account_name: accountName.trim() || null, is_primary: primary });
      onSaved();
    } catch (e) { Alert.alert('Could not save', (e as Error).message); } finally { setBusy(false); }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end">
        <Pressable onPress={onClose} className="absolute inset-0 bg-black/50" />
        <View className="rounded-t-[28px] border-t border-hairline bg-surface px-4 pt-4" style={{ paddingBottom: insets.bottom + 20 }}>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-[17px] font-semibold text-ink">{account ? 'Edit bank account' : 'Add bank account'}</Text>
            <Pressable onPress={onClose} className="h-9 w-9 items-center justify-center rounded-full bg-surface2"><X size={18} color={colors.ink} /></Pressable>
          </View>

          <View className="gap-3.5">
            <View>
              <Text className="mb-1.5 text-[13px] font-medium text-graphite">IBAN</Text>
              <TextInput value={formatIban(iban)} onChangeText={setIban} placeholder="AE__ ____ ____ ____ ____ ___" autoCapitalize="characters" placeholderTextColor={colors.graphiteLight} className="rounded-2xl border border-hairline bg-surface2 px-4 py-3.5 text-base text-ink" />
              {ibanCheck ? (
                <View className="mt-1.5 flex-row items-center gap-1.5">
                  {ibanCheck.valid ? <><Check size={13} color={colors.accent} /><Text className="text-[12px] text-graphite">Valid UAE IBAN · bank code {ibanCheck.bankCode}</Text></> : <Text className="text-[12px]" style={{ color: DANGER }}>Not a valid UAE IBAN yet</Text>}
                </View>
              ) : null}
            </View>
            <View>
              <Text className="mb-1.5 text-[13px] font-medium text-graphite">Bank name</Text>
              <TextInput value={bankName} onChangeText={setBankName} placeholder="e.g. Emirates NBD" placeholderTextColor={colors.graphiteLight} className="rounded-2xl border border-hairline bg-surface2 px-4 py-3.5 text-base text-ink" />
            </View>
            <View>
              <Text className="mb-1.5 text-[13px] font-medium text-graphite">Account holder name</Text>
              <TextInput value={accountName} onChangeText={setAccountName} placeholder="As on your bank account" placeholderTextColor={colors.graphiteLight} className="rounded-2xl border border-hairline bg-surface2 px-4 py-3.5 text-base text-ink" />
            </View>
            <Press onPress={() => setPrimary((p) => !p)} className="flex-row items-center gap-3 rounded-2xl border border-hairline bg-surface2 px-4 py-3.5">
              <View className={`h-6 w-6 items-center justify-center rounded-full ${primary ? 'bg-accent' : 'border border-hairline bg-surface'}`}>
                {primary ? <Check size={14} color={colors.onAccent} /> : null}
              </View>
              <Text className="flex-1 text-[14px] font-medium text-ink">Set as primary payout account</Text>
            </Press>
          </View>

          <Press disabled={busy} onPress={save} className="mt-5 h-[52px] flex-row items-center justify-center gap-2 rounded-full bg-accent">
            {busy ? <ActivityIndicator color={colors.onAccent} /> : <><Check size={18} color={colors.onAccent} /><Text className="text-[15px] font-semibold" style={{ color: colors.onAccent }}>{account ? 'Save changes' : 'Add account'}</Text></>}
          </Press>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
