import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Avatar } from "../../src/components/Avatar";
import { Badge } from "../../src/components/Badge";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Input } from "../../src/components/Input";
import { EmptyState, ErrorBox, Loading } from "../../src/components/Loading";
import { MatchScore } from "../../src/components/MatchScore";
import { TagBadge } from "../../src/components/TagBadge";
import { applicationsApi, savedMatchesApi } from "../../src/lib/api";
import { colors, fonts, radius } from "../../src/lib/theme";

type Filter = "ALL" | "PROJECT" | "ARTICLE";

export default function SavedMatchesScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("ALL");

  const params = filter !== "ALL" ? `purpose=${filter}` : undefined;
  const { data, isLoading, isFetching, refetch } = useQuery<any>({
    queryKey: ["saved-matches", filter],
    queryFn: () => savedMatchesApi.list(params),
  });

  const remove = useMutation({
    mutationFn: (sm: any) =>
      savedMatchesApi.unsave({
        professorId: sm.professor.id,
        purpose: sm.purpose,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-matches"] }),
  });

  const items: any[] = data?.data || [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Text style={styles.title}>Kaydedilen Eşleşmeler</Text>
      <Text style={styles.subtitle}>
        Eşleştirme yaparken kaydettiğin akademisyenler
      </Text>

      <View style={styles.tabs}>
        {(
          [
            { value: "ALL", label: "Tümü" },
            { value: "PROJECT", label: "Proje" },
            { value: "ARTICLE", label: "Makale" },
          ] as { value: Filter; label: string }[]
        ).map((t) => (
          <Pressable
            key={t.value}
            style={[styles.tab, filter === t.value && styles.tabActive]}
            onPress={() => setFilter(t.value)}
          >
            <Text
              style={[
                styles.tabText,
                filter === t.value && styles.tabTextActive,
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <Loading />
      ) : items.length === 0 ? (
        <View style={{ marginTop: 12 }}>
          <EmptyState
            title="Kayıt yok"
            description="Eşleştirme yap ve beğendiklerini kaydet"
          />
          <View style={{ alignItems: "center", marginTop: 10 }}>
            <Button
              title="Eşleştirmeye Git"
              onPress={() => router.push("/matching")}
            />
          </View>
        </View>
      ) : (
        items.map((sm: any) => (
          <SavedMatchCard
            key={sm.id}
            sm={sm}
            onRemove={() => remove.mutate(sm)}
          />
        ))
      )}
    </ScrollView>
  );
}

function SavedMatchCard({
  sm,
  onRemove,
}: {
  sm: any;
  onRemove: () => void;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const prof = sm.professor;
  const [showApply, setShowApply] = useState(false);
  const [target, setTarget] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [applied, setApplied] = useState<Set<string>>(new Set());

  const apply = useMutation({
    mutationFn: () =>
      applicationsApi.apply(target as string, {
        message: message || undefined,
      }),
    onSuccess: (_d, _v) => {
      if (target) {
        setApplied((p) => new Set([...p, target]));
      }
      setShowApply(false);
      setTarget(null);
      setMessage("");
      qc.invalidateQueries({ queryKey: ["my-applications"] });
    },
    onError: (e: any) => setError(e.message || "Başvuru gönderilemedi"),
  });

  return (
    <>
      <Card style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: "row" }}>
          <Avatar name={prof.name} size={48} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.headRow}>
              <Pressable
                onPress={() => router.push(`/professors/${prof.id}` as any)}
                style={{ flex: 1 }}
              >
                <Text style={styles.name}>{prof.name}</Text>
              </Pressable>
              <Badge
                label={sm.purpose === "PROJECT" ? "Proje" : "Makale"}
                tone="secondary"
              />
            </View>
            <Text style={styles.meta}>{prof.department}</Text>

            {sm.matchScore > 0 ? (
              <View style={{ marginTop: 10 }}>
                <MatchScore score={sm.matchScore} />
              </View>
            ) : null}

            {sm.description ? (
              <View style={styles.descBox}>
                <Text style={styles.descLabel}>Arama açıklaman</Text>
                <Text style={styles.descText} numberOfLines={2}>
                  {sm.description}
                </Text>
              </View>
            ) : null}

            {prof.tags?.length ? (
              <View style={styles.tags}>
                {prof.tags.slice(0, 5).map((t: any) => (
                  <TagBadge key={t.id} name={t.name} category={t.category} />
                ))}
              </View>
            ) : null}

            {sm.purpose === "PROJECT" && prof.projects?.length ? (
              <View style={styles.projects}>
                <Text style={styles.projectsLabel}>Açık Projeleri:</Text>
                {prof.projects.map((p: any) => (
                  <View key={p.id} style={styles.projectRow}>
                    <Pressable
                      style={{ flex: 1 }}
                      onPress={() =>
                        router.push(`/projects/${p.id}` as any)
                      }
                    >
                      <Text style={styles.projectTitle} numberOfLines={1}>
                        • {p.title}
                      </Text>
                    </Pressable>
                    {applied.has(p.id) ? (
                      <Text style={styles.appliedText}>Başvuruldu</Text>
                    ) : (
                      <Button
                        title="Başvur"
                        size="sm"
                        variant="ghost"
                        onPress={() => {
                          setTarget(p.id);
                          setError("");
                          setShowApply(true);
                        }}
                      />
                    )}
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title="Profili Gör"
            variant="outline"
            size="sm"
            onPress={() => router.push(`/professors/${prof.id}` as any)}
            style={{ flex: 1 }}
          />
          <Button
            title="Kaldır"
            variant="danger"
            size="sm"
            onPress={onRemove}
          />
        </View>
      </Card>

      <Modal
        visible={showApply}
        transparent
        animationType="fade"
        onRequestClose={() => setShowApply(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setShowApply(false)}
        >
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Projeye Başvur</Text>
            <Text style={styles.sheetSub}>
              {prof.projects?.find((p: any) => p.id === target)?.title}
            </Text>
            {error ? <ErrorBox message={error} /> : null}
            <Input
              label="Başvuru notu (opsiyonel)"
              multiline
              value={message}
              onChangeText={setMessage}
              placeholder="Neden bu projede yer almak istiyorsun?"
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <Button
                title="İptal"
                variant="outline"
                style={{ flex: 1 }}
                onPress={() => setShowApply(false)}
              />
              <Button
                title={apply.isPending ? "Gönderiliyor..." : "Gönder"}
                loading={apply.isPending}
                onPress={() => apply.mutate()}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fonts.size.xxl, fontWeight: "800", color: colors.text },
  subtitle: {
    marginTop: 4,
    fontSize: fonts.size.sm,
    color: colors.textMuted,
    marginBottom: 14,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, alignItems: "center" },
  tabActive: { backgroundColor: colors.primarySoft },
  tabText: { fontSize: fonts.size.sm, fontWeight: "600", color: colors.textMuted },
  tabTextActive: { color: colors.primary },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: { fontSize: fonts.size.md, fontWeight: "700", color: colors.text },
  meta: { fontSize: fonts.size.sm, color: colors.textMuted, marginTop: 2 },
  descBox: {
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 10,
  },
  descLabel: { fontSize: fonts.size.xs, color: colors.textMuted, marginBottom: 2 },
  descText: { fontSize: fonts.size.sm, color: colors.text },
  tags: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  projects: {
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 10,
  },
  projectsLabel: {
    fontSize: fonts.size.xs,
    color: colors.textMuted,
    marginBottom: 4,
  },
  projectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  projectTitle: { fontSize: fonts.size.sm, color: colors.text },
  appliedText: {
    fontSize: fonts.size.xs,
    color: colors.success,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    width: "100%",
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: 16,
  },
  sheetTitle: { fontSize: fonts.size.lg, fontWeight: "700", color: colors.text },
  sheetSub: {
    fontSize: fonts.size.sm,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
});
