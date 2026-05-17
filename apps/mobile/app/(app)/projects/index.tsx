import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "../../../src/components/Button";
import { Input } from "../../../src/components/Input";
import { EmptyState, Loading } from "../../../src/components/Loading";
import { ProjectCard } from "../../../src/components/ProjectCard";
import { projectsApi } from "../../../src/lib/api";
import { useAuth } from "../../../src/lib/auth-context";
import { colors, fonts, radius } from "../../../src/lib/theme";

const STATUSES: { value: string; label: string }[] = [
  { value: "ALL", label: "Tümü" },
  { value: "OPEN", label: "Açık" },
  { value: "IN_PROGRESS", label: "Devam" },
  { value: "CLOSED", label: "Kapalı" },
];

export default function ProjectsTab() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", "12");
    if (search) p.set("search", search);
    if (status !== "ALL") p.set("status", status);
    return p.toString();
  }, [page, search, status]);

  const { data, isLoading, isFetching, refetch } = useQuery<any>({
    queryKey: ["projects", page, search, status],
    queryFn: () => projectsApi.list(params),
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Projeler</Text>
        {user?.role === "PROFESSOR" ? (
          <Button
            title="+ Yeni"
            size="sm"
            onPress={() => router.push("/projects/new")}
          />
        ) : null}
      </View>

      <Input
        placeholder="Proje ara..."
        value={search}
        onChangeText={(v) => {
          setSearch(v);
          setPage(1);
        }}
        containerStyle={{ marginBottom: 10 }}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 14 }}
      >
        {STATUSES.map((s) => (
          <Pressable
            key={s.value}
            style={[
              styles.chip,
              status === s.value && styles.chipActive,
            ]}
            onPress={() => {
              setStatus(s.value);
              setPage(1);
            }}
          >
            <Text
              style={[
                styles.chipText,
                status === s.value && styles.chipTextActive,
              ]}
            >
              {s.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <Loading />
      ) : (data?.data?.length ?? 0) === 0 ? (
        <EmptyState title="Sonuç bulunamadı" />
      ) : (
        data.data.map((p: any) => <ProjectCard key={p.id} {...p} />)
      )}

      {data?.meta && data.meta.totalPages > 1 ? (
        <View style={styles.pager}>
          <Button
            title="Önceki"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onPress={() => setPage((p) => p - 1)}
          />
          <Text style={styles.pageText}>
            {page} / {data.meta.totalPages}
          </Text>
          <Button
            title="Sonraki"
            variant="outline"
            size="sm"
            disabled={page >= data.meta.totalPages}
            onPress={() => setPage((p) => p + 1)}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { fontSize: fonts.size.xxl, fontWeight: "800", color: colors.text },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { color: colors.text, fontSize: fonts.size.sm, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  pager: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 16,
  },
  pageText: { color: colors.textMuted, fontSize: fonts.size.sm, fontWeight: "600" },
});
