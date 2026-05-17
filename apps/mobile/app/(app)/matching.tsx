import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Badge } from "../../src/components/Badge";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Input } from "../../src/components/Input";
import { ErrorBox, Loading } from "../../src/components/Loading";
import { ProfileCard } from "../../src/components/ProfileCard";
import { Section } from "../../src/components/Section";
import { TagSelector } from "../../src/components/TagSelector";
import {
  matchingApi,
  profileApi,
  professorApplicationsApi,
  savedMatchesApi,
  teamIdeasApi,
} from "../../src/lib/api";
import { useAuth } from "../../src/lib/auth-context";
import { colors, fonts, radius } from "../../src/lib/theme";

type Purpose = "ARTICLE" | "PROJECT";

export default function MatchingScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [description, setDescription] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [applyTo, setApplyTo] = useState<any | null>(null);

  const profileQ = useQuery<any>({
    queryKey: ["profile"],
    queryFn: () => profileApi.getMe(),
  });

  useEffect(() => {
    const p = profileQ.data?.data;
    if (p?.tags?.length > 0 && tagIds.length === 0) {
      setTagIds(p.tags.map((t: any) => t.id));
    }
  }, [profileQ.data]);

  const match = useMutation({
    mutationFn: () =>
      matchingApi.matchProfessors({
        purpose: purpose!,
        description: description || undefined,
        tagIds: tagIds.length > 0 ? tagIds : undefined,
        year: profileQ.data?.data?.year || undefined,
        limit: 20,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-match-ids"] });
    },
    onError: (e: any) => setError(e.message || "Eşleştirme başarısız"),
  });

  const savedIds = useQuery<any>({
    queryKey: ["saved-match-ids", purpose],
    queryFn: () => savedMatchesApi.ids(purpose || undefined),
    enabled: !!match.data,
  });
  const savedProfIds = new Set(
    (savedIds.data?.data || [])
      .filter((s: any) => s.purpose === purpose)
      .map((s: any) => s.professorId)
  );

  const save = useMutation({
    mutationFn: (prof: any) =>
      savedMatchesApi.save({
        professorId: prof.id,
        purpose: purpose!,
        description: description || undefined,
        matchScore: prof.matchScore,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-match-ids"] }),
  });
  const unsave = useMutation({
    mutationFn: (profId: string) =>
      savedMatchesApi.unsave({ professorId: profId, purpose: purpose! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-match-ids"] }),
  });

  const reset = () => {
    setPurpose(null);
    setDescription("");
    setTagIds(profileQ.data?.data?.tags?.map((t: any) => t.id) || []);
    setError("");
    match.reset();
  };

  const onSubmit = () => {
    setError("");
    if (!purpose) return setError("Önce amaç seç");
    if (description.trim().length < 10)
      return setError("Açıklama en az 10 karakter olmalı");
    if (tagIds.length === 0) return setError("En az 1 tag seç");
    match.mutate();
  };

  if (profileQ.isLoading) return <Loading />;

  // Professor için Ekip Kur formu
  if (user?.role === "PROFESSOR") {
    return <TeamBuildScreen />;
  }

  const results = match.data?.data || [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.surface }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {!match.data ? (
          <View>
            <Text style={styles.title}>Akademisyen Eşleştirme</Text>
            <Text style={styles.subtitle}>
              Amacını, projeni ve ilgi alanlarını belirt; sana en uygun
              hocaları bulalım.
            </Text>

            {error ? <ErrorBox message={error} /> : null}

            <Section title="1) Amacın nedir?">
              <View style={{ flexDirection: "row", gap: 10 }}>
                {(
                  [
                    { value: "PROJECT", label: "Proje" },
                    { value: "ARTICLE", label: "Makale" },
                  ] as { value: Purpose; label: string }[]
                ).map((o) => (
                  <Pressable
                    key={o.value}
                    style={[
                      styles.choice,
                      purpose === o.value && styles.choiceActive,
                    ]}
                    onPress={() => setPurpose(o.value)}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        purpose === o.value && styles.choiceTextActive,
                      ]}
                    >
                      {o.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Section>

            <Section title="2) Detay">
              <Input
                placeholder="Hangi konuda çalışmak istiyorsun? Kısa bir açıklama..."
                multiline
                value={description}
                onChangeText={setDescription}
              />
            </Section>

            <Section title="3) İlgi Alanları">
              <Card padded>
                <TagSelector
                  selected={tagIds}
                  onChange={setTagIds}
                  max={10}
                />
              </Card>
            </Section>

            <Button
              title={match.isPending ? "Eşleştiriliyor..." : "Eşleştir"}
              loading={match.isPending}
              onPress={onSubmit}
              fullWidth
            />
          </View>
        ) : (
          <View>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>
                  Sonuçlar ({results.length})
                </Text>
                <Text style={styles.subtitle}>
                  {purpose === "ARTICLE" ? "Makale" : "Proje"} odaklı eşleşmeler
                </Text>
              </View>
              <Button
                title="Yeni Eşleştirme"
                size="sm"
                variant="outline"
                onPress={reset}
              />
            </View>

            {results.length === 0 ? (
              <Card>
                <Text style={styles.subtitle}>
                  Bu kriterlerle eşleşme bulunamadı. Tag veya açıklamayı
                  güncelleyip tekrar dene.
                </Text>
              </Card>
            ) : (
              results.map((prof: any) => {
                const isSaved = savedProfIds.has(prof.id);
                return (
                  <View key={prof.id}>
                    <ProfileCard {...prof} />
                    <View style={{ marginTop: -4, marginBottom: 12 }}>
                      <Card padded={false} style={{ padding: 10 }}>
                        <View style={styles.actionRow}>
                          <Badge
                            label={`%${Math.round(prof.matchScore || 0)} eşleşme`}
                            tone="default"
                          />
                          <View style={{ flexDirection: "row", gap: 6 }}>
                            <Button
                              title={isSaved ? "Kaldır" : "Kaydet"}
                              size="sm"
                              variant={isSaved ? "outline" : "outline"}
                              onPress={() =>
                                isSaved
                                  ? unsave.mutate(prof.id)
                                  : save.mutate(prof)
                              }
                            />
                            <Button
                              title="Başvur"
                              size="sm"
                              onPress={() => setApplyTo(prof)}
                            />
                          </View>
                        </View>
                      </Card>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
      {applyTo ? (
        <ApplyToProfessorModal
          professor={applyTo}
          purpose={purpose!}
          description={description}
          tagIds={tagIds}
          onClose={() => setApplyTo(null)}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

// ─── Hocaya direkt başvuru modal'ı ──────────────────
function ApplyToProfessorModal({
  professor,
  purpose,
  description,
  tagIds,
  onClose,
}: {
  professor: any;
  purpose: Purpose;
  description: string;
  tagIds: string[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState(
    description?.slice(0, 60) || "Yeni proje önerisi"
  );
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  const send = useMutation({
    mutationFn: () =>
      professorApplicationsApi.send({
        professorId: professor.id,
        purpose,
        title: title.trim(),
        description: description || title.trim(),
        tagIds,
        message: message || undefined,
      }),
    onSuccess: () => {
      setDone(true);
      setTimeout(onClose, 1200);
    },
  });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.sheetTitle}>Hocaya Başvur</Text>
          <Text style={styles.sheetSub}>
            {professor.name}'a proje önerisi gönder. Kabul edilirse otomatik bir proje oluşur ve sen üye olarak eklenirsin.
          </Text>

          {send.isError ? (
            <ErrorBox message={(send.error as any)?.message || "Gönderilemedi"} />
          ) : null}

          <Input
            label="Proje Başlığı"
            value={title}
            onChangeText={setTitle}
            containerStyle={{ marginBottom: 10 }}
          />
          <Input
            label="Mesaj (opsiyonel)"
            value={message}
            onChangeText={setMessage}
            multiline
            placeholder="Kısa bir mesaj yaz..."
            containerStyle={{ marginBottom: 10 }}
          />

          {done ? (
            <Text style={{ color: colors.success, fontWeight: "700", marginBottom: 6 }}>
              ✓ Başvuru gönderildi
            </Text>
          ) : null}

          <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
            <Button
              title="İptal"
              variant="outline"
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <Button
              title={send.isPending ? "Gönderiliyor..." : "Gönder"}
              loading={send.isPending}
              disabled={title.trim().length < 5 || tagIds.length === 0}
              onPress={() => send.mutate()}
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fonts.size.xxl, fontWeight: "800", color: colors.text },
  subtitle: {
    marginTop: 6,
    fontSize: fonts.size.sm,
    color: colors.textMuted,
    marginBottom: 16,
  },
  choice: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
  },
  choiceActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choiceText: { fontSize: fonts.size.md, fontWeight: "700", color: colors.text },
  choiceTextActive: { color: "#fff" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  sheet: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetTitle: {
    fontSize: fonts.size.lg,
    fontWeight: "800",
    color: colors.text,
  },
  sheetSub: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: fonts.size.sm,
    color: colors.textMuted,
  },
});

// ─── Professor: Ekip Kur ────────────────────────────
function TeamBuildScreen() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [profSlots, setProfSlots] = useState("1");
  const [studentSlots, setStudentSlots] = useState("2");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [selectedProfs, setSelectedProfs] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const match = useMutation({
    mutationFn: () =>
      matchingApi.matchTeam({
        title,
        description,
        professorSlots: Number(profSlots) || 1,
        studentSlots: Number(studentSlots) || 1,
        tagIds,
        limit: 20,
      }),
    onError: (e: any) => setError(e.message || "Eşleştirme başarısız"),
  });

  const create = useMutation({
    mutationFn: () =>
      teamIdeasApi.create({
        title,
        description,
        professorSlots: Number(profSlots) || 1,
        studentSlots: Number(studentSlots) || 1,
        tagIds,
        selectedProfessorIds: selectedProfs,
        professorInvites: selectedProfs.map((id) => ({ userId: id })),
        studentInvites: selectedStudents.map((id) => ({ userId: id })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-ideas-my"] });
      reset();
    },
    onError: (e: any) => setError(e.message || "Kayıt başarısız"),
  });

  const reset = () => {
    setTitle("");
    setDescription("");
    setProfSlots("1");
    setStudentSlots("2");
    setTagIds([]);
    setSelectedProfs([]);
    setSelectedStudents([]);
    setError("");
    match.reset();
    create.reset();
  };

  const onMatch = () => {
    setError("");
    if (title.trim().length < 5)
      return setError("Başlık en az 5 karakter olmalı");
    if (description.trim().length < 10)
      return setError("Açıklama en az 10 karakter olmalı");
    if (tagIds.length === 0) return setError("En az 1 tag seç");
    match.mutate();
  };

  const toggleProf = (id: string) =>
    setSelectedProfs((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );
  const toggleStudent = (id: string) =>
    setSelectedStudents((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );

  const results = match.data?.data || {};
  const matchedProfs: any[] = results.professors || [];
  const matchedStudents: any[] = results.students || [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.surface }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Ekip Kur</Text>
        <Text style={styles.subtitle}>
          Proje fikrini gir, uygun hoca ve öğrencileri seç, ekibi kaydet.
        </Text>

        {error ? <ErrorBox message={error} /> : null}

        {!match.data ? (
          <View style={{ gap: 14 }}>
            <Card padded>
              <Input
                label="Proje Başlığı"
                placeholder="Ör: Türkçe NLP ile Duygu Analizi"
                value={title}
                onChangeText={setTitle}
                containerStyle={{ marginBottom: 12 }}
              />
              <Input
                label="Açıklama"
                multiline
                placeholder="Proje hakkında detaylı bilgi..."
                value={description}
                onChangeText={setDescription}
              />
              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <Input
                  label="Hoca Kontenjanı"
                  keyboardType="number-pad"
                  value={profSlots}
                  onChangeText={(v) =>
                    setProfSlots(v.replace(/[^0-9]/g, ""))
                  }
                  containerStyle={{ flex: 1 }}
                />
                <Input
                  label="Öğrenci Kontenjanı"
                  keyboardType="number-pad"
                  value={studentSlots}
                  onChangeText={(v) =>
                    setStudentSlots(v.replace(/[^0-9]/g, ""))
                  }
                  containerStyle={{ flex: 1 }}
                />
              </View>
            </Card>

            <Card padded>
              <Text style={{ fontWeight: "700", marginBottom: 8, color: colors.text }}>
                İlgi Alanları
              </Text>
              <TagSelector
                selected={tagIds}
                onChange={setTagIds}
                max={10}
              />
            </Card>

            <Button
              title={match.isPending ? "Eşleştiriliyor..." : "Adayları Bul"}
              loading={match.isPending}
              onPress={onMatch}
              fullWidth
            />
          </View>
        ) : (
          <View>
            <View style={styles.headerRow}>
              <View>
                <Text style={{ fontSize: fonts.size.lg, fontWeight: "700", color: colors.text }}>
                  Aday Listesi
                </Text>
                <Text style={styles.subtitle}>
                  Ekibe almak istediklerini seç
                </Text>
              </View>
              <Button
                title="Sıfırla"
                size="sm"
                variant="outline"
                onPress={reset}
              />
            </View>

            {matchedProfs.length > 0 ? (
              <View style={{ marginBottom: 18 }}>
                <Text style={{ fontWeight: "700", marginBottom: 8, color: colors.text }}>
                  Akademisyenler ({matchedProfs.length})
                </Text>
                {matchedProfs.map((p: any) => {
                  const picked = selectedProfs.includes(p.id);
                  return (
                    <View key={p.id} style={{ marginBottom: 10 }}>
                      <ProfileCard {...p} />
                      <View style={{ marginTop: -4 }}>
                        <Button
                          title={picked ? "✓ Seçildi" : "Ekibe Ekle"}
                          variant={picked ? "success" : "outline"}
                          size="sm"
                          onPress={() => toggleProf(p.id)}
                          fullWidth
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {matchedStudents.length > 0 ? (
              <View style={{ marginBottom: 18 }}>
                <Text style={{ fontWeight: "700", marginBottom: 8, color: colors.text }}>
                  Öğrenciler ({matchedStudents.length})
                </Text>
                {matchedStudents.map((s: any) => {
                  const picked = selectedStudents.includes(s.id);
                  return (
                    <View key={s.id} style={{ marginBottom: 10 }}>
                      <ProfileCard {...s} />
                      <View style={{ marginTop: -4 }}>
                        <Button
                          title={picked ? "✓ Seçildi" : "Ekibe Ekle"}
                          variant={picked ? "success" : "outline"}
                          size="sm"
                          onPress={() => toggleStudent(s.id)}
                          fullWidth
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {matchedProfs.length === 0 && matchedStudents.length === 0 ? (
              <Card>
                <Text style={styles.subtitle}>
                  Bu kriterlere uygun aday bulunamadı. Tag veya açıklamayı
                  güncelleyip tekrar dene.
                </Text>
              </Card>
            ) : null}

            <Button
              title={
                create.isPending
                  ? "Kaydediliyor..."
                  : `Ekibi Kaydet (${selectedProfs.length} hoca + ${selectedStudents.length} öğrenci)`
              }
              loading={create.isPending}
              disabled={
                selectedProfs.length === 0 && selectedStudents.length === 0
              }
              onPress={() => create.mutate()}
              fullWidth
            />
            {create.isSuccess ? (
              <Text
                style={{
                  marginTop: 12,
                  color: colors.success,
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                ✓ Ekip kaydedildi
              </Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
