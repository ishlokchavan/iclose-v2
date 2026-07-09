import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, Modal, Pressable, Linking } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { ArrowLeft, Plus, Trash2, FileText, ImageIcon, X, Camera } from 'lucide-react-native';
import { GlassBg } from '@/components/Glass';
import { Press, FadeIn } from '@/components/Press';
import { listDocuments, addDocument, deleteDocument, documentUrl, DOC_KIND_LABEL, type UserDocument, type DocKind, type PickedFile } from '@/lib/profile-data';
import { formatDate } from '@/lib/format';
import { colors } from '@/theme/tokens';

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
    const rows = await listDocuments();
    setDocs(rows);
    const entries = await Promise.all(rows.filter(isImage).map(async (d) => [d.id, await documentUrl(d.path)] as const));
    setThumbs(Object.fromEntries(entries.filter(([, u]) => u)) as Record<string, string>);
  }, []);
  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  async function upload(file: PickedFile, kind: DocKind) {
    setBusy(true);
    try {
      await addDocument(file, kind);
      await load();
    } catch (e) { Alert.alert('Upload failed', (e as Error).message); } finally { setBusy(false); }
  }

  async function pickPhoto(kind: DocKind) {
    setAddOpen(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow photo access to upload.');
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    if (res.canceled) return;
    const a = res.assets[0];
    await upload({ uri: a.uri, base64: a.base64, mimeType: a.mimeType, name: a.fileName }, kind);
  }

  async function pickFile(kind: DocKind) {
    setAddOpen(false);
    const res = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
    if (res.canceled) return;
    const a = res.assets[0];
    await upload({ uri: a.uri, mimeType: a.mimeType, name: a.name }, kind);
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
    const url = await documentUrl(doc.path);
    if (!url) return;
    if (isImage(doc)) setPreview({ url, name: doc.name ?? DOC_KIND_LABEL[doc.kind] });
    else Linking.openURL(url);
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
            <View className="gap-2.5">
              {docs.map((d, i) => {
                const thumb = thumbs[d.id];
                return (
                  <FadeIn key={d.id} delay={Math.min(i, 10) * 30}>
                    <Press onPress={() => openDoc(d)} className="flex-row items-center gap-3.5 rounded-apple border border-hairline bg-surface p-3">
                      <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-surface2">
                        {thumb ? <Image source={{ uri: thumb }} style={{ width: 56, height: 56 }} contentFit="cover" /> : isImage(d) ? <ImageIcon size={22} color={colors.graphite} /> : <FileText size={22} color={colors.graphite} />}
                      </View>
                      <View className="flex-1">
                        <Text className="text-[11px] font-semibold uppercase tracking-wide text-accent">{DOC_KIND_LABEL[d.kind]}</Text>
                        <Text className="text-[14.5px] font-semibold text-ink" numberOfLines={1}>{d.name ?? DOC_KIND_LABEL[d.kind]}</Text>
                        <Text className="text-[11.5px] text-graphite-light">{formatDate(d.created_at)}</Text>
                      </View>
                      <Press onPress={() => confirmDelete(d)} haptic={false} className="h-9 w-9 items-center justify-center rounded-full bg-surface2">
                        <Trash2 size={16} color="#ff453a" />
                      </Press>
                    </Press>
                  </FadeIn>
                );
              })}
            </View>
          )}

          <Press disabled={busy} onPress={() => setAddOpen(true)} className="mt-5 h-[52px] flex-row items-center justify-center gap-2 rounded-full bg-accent">
            {busy ? <ActivityIndicator color={colors.onAccent} /> : <><Plus size={18} color={colors.onAccent} /><Text className="text-[15px] font-semibold" style={{ color: colors.onAccent }}>Add document</Text></>}
          </Press>
        </ScrollView>
      )}

      {/* Add modal */}
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
                <Camera size={18} color={colors.accent} /><Text className="text-[14px] font-semibold text-ink">Photo</Text>
              </Press>
              <Press onPress={() => pickFile(addKind)} className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-hairline bg-surface2 py-4">
                <FileText size={18} color={colors.accent} /><Text className="text-[14px] font-semibold text-ink">File / PDF</Text>
              </Press>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Image preview */}
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
