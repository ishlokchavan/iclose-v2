import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert, ActivityIndicator, Modal, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Trash2, Landmark, X, Check, Star, Pencil } from 'lucide-react-native';
import { GlassBg } from '@/components/Glass';
import { Press, FadeIn } from '@/components/Press';
import { SecureNote } from '@/components/ListKit';
import { listBankAccounts, addBankAccount, updateBankAccount, setPrimaryBank, deleteBankAccount, type BankAccount } from '@/lib/profile-data';
import { lookupIban, maskIban } from '@/lib/iban';
import { formatIban } from '@/lib/profile-uploads';
import { colors } from '@/theme/tokens';

const DANGER = '#ff453a';

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
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          {accounts.length === 0 ? (
            <View className="mt-16 items-center gap-3 px-8">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-surface2"><Landmark size={28} color={colors.graphite} /></View>
              <Text className="text-center text-[15px] text-graphite">No bank accounts yet. Add one to receive your commission payouts — your first account is set as primary.</Text>
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
          <SecureNote text="Bank details are encrypted and visible only to our payouts team." />
        </ScrollView>
      )}

      {editing !== undefined ? (
        <BankForm
          account={editing}
          isFirst={!editing && accounts.length === 0}
          onClose={() => setEditing(undefined)}
          onSaved={async () => { setEditing(undefined); await load(); }}
        />
      ) : null}
    </View>
  );
}

function BankForm({ account, isFirst, onClose, onSaved }: { account: BankAccount | null; isFirst: boolean; onClose: () => void; onSaved: () => void }) {
  const insets = useSafeAreaInsets();
  const [iban, setIban] = useState(account?.iban ?? '');
  const [bankName, setBankName] = useState(account?.bank_name ?? '');
  const [accountName, setAccountName] = useState(account?.account_name ?? '');
  const [primary, setPrimary] = useState(account?.is_primary ?? false);
  const [busy, setBusy] = useState(false);

  // Auto-lookup as the user types, like real banking apps.
  const lookup = iban.replace(/\s+/g, '').length > 0 ? lookupIban(iban) : null;
  const detectedBank = lookup?.valid ? lookup.bankName : null;

  async function save() {
    const clean = iban.replace(/\s+/g, '').toUpperCase();
    const check = lookupIban(clean);
    if (!check.valid) return Alert.alert('Invalid IBAN', 'Enter a valid UAE IBAN.');
    const finalBankName = (check.bankName ?? bankName.trim()) || null;
    setBusy(true);
    try {
      if (account) {
        await updateBankAccount(account.id, { iban: clean, bank_name: finalBankName, account_name: accountName.trim() || null, is_primary: primary });
      } else {
        await addBankAccount({
          iban: clean,
          bank_name: finalBankName,
          account_name: accountName.trim() || null,
          // First account becomes primary automatically (handled by the data layer).
          ...(isFirst ? {} : { is_primary: primary }),
        });
      }
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
              {lookup ? (
                <View className="mt-1.5 flex-row items-center gap-1.5">
                  {lookup.valid ? (
                    <><Check size={13} color={colors.accent} /><Text className="text-[12px] text-graphite">Valid UAE IBAN · account •••• {lookup.accountTail}</Text></>
                  ) : (
                    <Text className="text-[12px]" style={{ color: DANGER }}>Not a valid UAE IBAN yet</Text>
                  )}
                </View>
              ) : null}
            </View>

            <View>
              <Text className="mb-1.5 text-[13px] font-medium text-graphite">Bank</Text>
              {detectedBank ? (
                // Auto-filled from the IBAN — read-only, like real banking apps.
                <View className="flex-row items-center gap-2.5 rounded-2xl border border-accent/40 bg-surface2 px-4 py-3.5">
                  <Landmark size={16} color={colors.accent} />
                  <Text className="flex-1 text-base text-ink" numberOfLines={1}>{detectedBank}</Text>
                  <View className="rounded-full bg-accent/15 px-2 py-0.5">
                    <Text className="text-[11px] font-bold" style={{ color: colors.accent }}>{lookup!.bankCode}</Text>
                  </View>
                </View>
              ) : (
                <>
                  <TextInput value={bankName} onChangeText={setBankName} placeholder="e.g. Emirates NBD" placeholderTextColor={colors.graphiteLight} className="rounded-2xl border border-hairline bg-surface2 px-4 py-3.5 text-base text-ink" />
                  {lookup?.valid && !detectedBank ? (
                    <View className="mt-1.5 flex-row items-center gap-1.5">
                      <View className="rounded-full bg-surface2 px-2 py-0.5" style={{ borderWidth: 1, borderColor: colors.hairline }}>
                        <Text className="text-[11px] font-bold text-graphite">{lookup.bankCode}</Text>
                      </View>
                      <Text className="flex-1 text-[12px] text-graphite">Bank code not recognised — type the bank name.</Text>
                    </View>
                  ) : (
                    <Text className="mt-1.5 text-[12px] text-graphite-light">Detected automatically from a valid IBAN.</Text>
                  )}
                </>
              )}
            </View>

            <View>
              <Text className="mb-1.5 text-[13px] font-medium text-graphite">Account holder name</Text>
              <TextInput value={accountName} onChangeText={setAccountName} placeholder="As on your bank account" placeholderTextColor={colors.graphiteLight} className="rounded-2xl border border-hairline bg-surface2 px-4 py-3.5 text-base text-ink" />
            </View>

            {isFirst ? (
              <View className="flex-row items-center gap-3 rounded-2xl border border-hairline bg-surface2 px-4 py-3.5">
                <View className="h-6 w-6 items-center justify-center rounded-full bg-accent"><Star size={13} color={colors.onAccent} fill={colors.onAccent} /></View>
                <Text className="flex-1 text-[13.5px] font-medium text-ink">Your first account is set as primary.</Text>
              </View>
            ) : (
              <Press onPress={() => setPrimary((p) => !p)} className="flex-row items-center gap-3 rounded-2xl border border-hairline bg-surface2 px-4 py-3.5">
                <View className={`h-6 w-6 items-center justify-center rounded-full ${primary ? 'bg-accent' : 'border border-hairline bg-surface'}`}>
                  {primary ? <Check size={14} color={colors.onAccent} /> : null}
                </View>
                <Text className="flex-1 text-[14px] font-medium text-ink">Set as primary payout account</Text>
              </Press>
            )}
          </View>

          <Press disabled={busy} onPress={save} className="mt-5 h-[52px] flex-row items-center justify-center gap-2 rounded-full bg-accent">
            {busy ? <ActivityIndicator color={colors.onAccent} /> : <><Check size={18} color={colors.onAccent} /><Text className="text-[15px] font-semibold" style={{ color: colors.onAccent }}>{account ? 'Save changes' : 'Add account'}</Text></>}
          </Press>
          <SecureNote text="Bank details are encrypted and visible only to our payouts team." />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
