import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, Modal, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import { ArrowLeft, Plus, Trash2, FileText, ImageIcon, X, Camera } from 'lucide-react-native';
import { GlassBg } from '@/components/Glass';
import { Press, FadeIn } from '@/components/Press';
import { SecureNote } from '@/components/ListKit';
import { listDocuments, addDocument, deleteDocument, documentUrl, DOC_KIND_LABEL, type UserDocument, type DocKind, type PickedFile } from '@/lib/profile-data';
import { formatDate } from '@/lib/format';
import { colors } from '@/theme/tokens';

const DANGER = '#ff453a';
const KINDS: DocKind[] = ['emirates_id', 'passport', 'other'];

function isImage(doc: UserDocument): boolean {
  if (doc.mime) return doc.mime.startsWith('image/');
  return !/\.pdf$/i.test(doc.path);
}

export default function Documents() {
  const insets = useSafeAreaInsets();
  const [docs, setDocs] = useState<UserDocument[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addKind, setAddKind] = useState<DocKind>('emirates_id');
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const rows = await listDocuments();
      setDocs(rows);
      const entries = await Promise.all(rows.filter(isImage).map(async (d) => [d.id, await documentUrl(d.path)] as const));
      setThumbs(Object.fromEntries(entries.filter(([, u]) => u)) as Record<string, string>);
    } catch {
      // Keep whatever we had; pull-to-refresh isn't wired here, retry happens on next mount.
    }
  }, []);
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  // Grouped by kind label, in a fixed sensible order.
  const groups = useMemo(
    () => KINDS.map((k) => [k, docs.filter((d) => d.kind === k)] as const).filter(([, arr]) => arr.length > 0),
    [docs],
  );

  async function upload(file: PickedFile, kind: DocKind) {
    setBusy(true);
    try {
      await addDocument(file, kind);
      await load();
    } catch (e) {
      Alert.alert('Upload failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // The system pickers can't present while the add-sheet Modal is still
  // animating away (on iOS the presentation silently fails and the picker
  // wedges with "Different document picking in progress"). So: close the
  // sheet, wait for its dismissal, and guard against double-taps.
  const pickingRef = useRef(false);
  async function launchAfterSheet(fn: () => Promise<void>) {
    if (pickingRef.current) return;
    pickingRef.current = true;
    setAddOpen(false);
    await new Promise((r) => setTimeout(r, 700));
    try { await fn(); } finally { pickingRef.current = false; }
  }

  function pickPhoto(kind: DocKind) {
    launchAfterSheet(async () => {
      try {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) return Alert.alert('Permission needed', 'Allow photo access to upload.');
        const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
        if (res.canceled) return;
        const a = res.assets[0];
        await upload({ uri: a.uri, base64: a.base64, mimeType: a.mimeType, name: a.fileName }, kind);
      } catch (e) {
        Alert.alert('Could not pick photo', (e as Error).message);
      }
    });
  }

  function pickFile(kind: DocKind) {
    launchAfterSheet(async () => {
      try {
        const res = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
        if (res.canceled) return;
        const a = res.assets[0];
        // No base64 here — addDocument reads the cached file itself.
        await upload({ uri: a.uri, mimeType: a.mimeType, name: a.name }, kind);
      } catch (e) {
        Alert.alert('Could not pick file', (e as Error).message);
      }
    });
  }

  function confirmDelete(doc: UserDocument) {
    Alert.alert('Delete document', 'This permanently removes the document.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteDocument(doc); await load(); } catch (e) { Alert.alert('Could not delete', (e as Error).message); }
      } },
    ]);
  }

  async function openDoc(doc: UserDocument) {
    try {
      const url = await documentUrl(doc.path);
      if (!url) return Alert.alert('Could not open', 'The document is unavailable right now.');
      if (isImage(doc)) setPreview({ url, name: doc.name ?? DOC_KIND_LABEL[doc.kind] });
      else await WebBrowser.openBrowserAsync(url); // renders the PDF in the in-app browser
    } catch (e) {
      Alert.alert('Could not open', (e as Error).message);
    }
  }

  return (
    <View className="flex-1">
      <GlassBg />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center gap-2 px-4 pb-2">
        <Press onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-surface2">
          <ArrowLeft size={20} color={colors.ink} />
        </Press>
        <Text className="flex-1 text-[17px] font-semibold text-ink">Documents</Text>
      </View>

      {loading ? (
        <ActivityIndicator className="mt-20" color={colors.accent} />
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
          {docs.length === 0 ? (
            <View className="mt-16 items-center gap-3 px-8">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-surface2"><FileText size={28} color={colors.graphite} /></View>
              <Text className="text-center text-[15px] text-graphite">No documents yet. Add your Emirates ID, passport or other files to verify faster.</Text>
            </View>
          ) : (
            (() => {
              let running = 0;
              return groups.map(([kind, items]) => (
                <View key={kind} className="mb-4">
                  <View className="mb-2 mt-1 flex-row items-end justify-between px-1">
                    <Text className="text-[13px] font-semibold uppercase tracking-wide text-graphite">{DOC_KIND_LABEL[kind]}</Text>
                    <Text className="text-[13px] font-bold text-ink">{items.length}</Text>
                  </View>
                  <View className="gap-2.5">
                    {items.map((d) => {
                      const thumb = thumbs[d.id];
                      const image = isImage(d);
                      return (
                        <FadeIn key={d.id} delay={Math.min(running++, 10) * 30}>
                          <Press onPress={() => openDoc(d)} className="flex-row items-center gap-3.5 rounded-apple border border-hairline bg-surface p-3">
                            <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-surface2">
                              {image ? (
                                thumb
                                  ? <Image source={{ uri: thumb }} style={{ width: 56, height: 56 }} contentFit="cover" transition={150} />
                                  : <ImageIcon size={22} color={colors.graphite} />
                              ) : (
                                <>
                                  <FileText size={20} color={colors.graphite} />
                                  <View className="mt-1 rounded bg-accent px-1.5 py-px">
                                    <Text className="text-[8px] font-bold" style={{ color: colors.onAccent }}>PDF</Text>
                                  </View>
                                </>
                              )}
                            </View>
                            <View className="flex-1">
                              <Text className="text-[14.5px] font-semibold text-ink" numberOfLines={1}>{d.name ?? DOC_KIND_LABEL[d.kind]}</Text>
                              <Text className="mt-0.5 text-[11.5px] text-graphite-light">{formatDate(d.created_at)}</Text>
                            </View>
                            <Press onPress={() => confirmDelete(d)} haptic={false} className="h-9 w-9 items-center justify-center rounded-full bg-surface2">
                              <Trash2 size={16} color={DANGER} />
                            </Press>
                          </Press>
                        </FadeIn>
                      );
                    })}
                  </View>
                </View>
              ));
            })()
          )}

          <Press disabled={busy} onPress={() => setAddOpen(true)} className="mt-5 h-[52px] flex-row items-center justify-center gap-2 rounded-full bg-accent" style={busy ? { opacity: 0.75 } : undefined}>
            {busy
              ? <><ActivityIndicator color={colors.onAccent} /><Text className="text-[15px] font-semibold" style={{ color: colors.onAccent }}>Uploading…</Text></>
              : <><Plus size={18} color={colors.onAccent} /><Text className="text-[15px] font-semibold" style={{ color: colors.onAccent }}>Add document</Text></>}
          </Press>
          <SecureNote text="Documents are stored privately and used only for verification." />
        </ScrollView>
      )}

      {/* Add flow: kind chips, then source */}
      <Modal visible={addOpen} animationType="slide" transparent onRequestClose={() => setAddOpen(false)}>
        <Pressable onPress={() => setAddOpen(false)} className="flex-1 justify-end bg-black/50">
          <Pressable onPress={(e) => e.stopPropagation()} className="rounded-t-[28px] border-t border-hairline bg-surface px-4 pt-4" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[17px] font-semibold text-ink">Add document</Text>
              <Pressable onPress={() => setAddOpen(false)} className="h-9 w-9 items-center justify-center rounded-full bg-surface2"><X size={18} color={colors.ink} /></Pressable>
            </View>
            <Text className="mb-2 text-[13px] font-medium text-graphite">Type</Text>
            <View className="mb-5 flex-row gap-2">
              {KINDS.map((k) => {
                const on = addKind === k;
                return (
                  <Press key={k} onPress={() => setAddKind(k)} className={`flex-1 items-center rounded-2xl border py-3 ${on ? 'border-accent bg-accent' : 'border-hairline bg-surface2'}`}>
                    <Text className="text-[12.5px] font-semibold" style={{ color: on ? colors.onAccent : colors.ink }}>{DOC_KIND_LABEL[k]}</Text>
                  </Press>
                );
              })}
            </View>
            <View className="flex-row gap-2.5">
              <Press onPress={() => pickPhoto(addKind)} className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-hairline bg-surface2 py-4">
                <Camera size={18} color={colors.accent} /><Text className="text-[14px] font-semibold text-ink">Photo library</Text>
              </Press>
              <Press onPress={() => pickFile(addKind)} className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-hairline bg-surface2 py-4">
                <FileText size={18} color={colors.accent} /><Text className="text-[14px] font-semibold text-ink">File / PDF</Text>
              </Press>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Full-screen image preview */}
      <Modal visible={!!preview} animationType="fade" transparent onRequestClose={() => setPreview(null)}>
        <View className="flex-1 bg-black/95">
          <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center gap-2 px-4 pb-2">
            <Press onPress={() => setPreview(null)} className="h-10 w-10 items-center justify-center rounded-full bg-surface2">
              <X size={20} color={colors.ink} />
            </Press>
            <Text className="flex-1 text-[15px] font-semibold text-ink" numberOfLines={1}>{preview?.name}</Text>
          </View>
          {preview ? <Image source={{ uri: preview.url }} style={{ flex: 1, marginBottom: insets.bottom }} contentFit="contain" /> : null}
        </View>
      </Modal>
    </View>
  );
}
