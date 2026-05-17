import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Avatar } from "../../src/components/Avatar";
import { Badge } from "../../src/components/Badge";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { EmptyState, ErrorBox, Loading } from "../../src/components/Loading";
import { TagBadge } from "../../src/components/TagBadge";
import { applicationsApi } from "../../src/lib/api";
import { colors, fonts, radius } from "../../src/lib/theme";
import { formatDate, statusLabel } from "../../src/lib/utils";

type StatusFilter = "ALL" | "PENDING" | "ACCEPTED" | "REJECTED";

const TABS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "Tümü" },
  { value: "PENDING", label: "Beklemede" },
  { value: "ACCEPTED", label: "Kabul" },
  { value: "REJECTED", label: "Red" },
];

const tone = (s: string): "success" | "danger" | "secondary" => {
  if (s === "ACCEPTED") return "success";
  if (s === "REJECTED") return "danger";
  return "secondary";
};

export default function IncomingApplicationsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => `page=${page}&limit=10${filter !== "ALL" ? `&status=${filter}` : ""}`,
    [page, filter]
  );

  const { data, isLoading, isFetching, refetch, error } = useQuery<any>({
    queryKey: ["incoming-applications", filter, page],
    queryFn: () => applicationsApi.incoming(params),
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      applicationsApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incoming-applications"] });
    },
  });

  const counts = data?.counts || {
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  };
  const apps = data?.data || [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Text style={styles.title}>Gelen Başvurular</Text>
      <Text style={styles.subtitle}>
        Projelerine gelen başvuruları kabul edebilir ya da reddedebilirsin.
      </Text>

      {error ? (
        <View style={{ marginBottom: 12 }}>
          <ErrorBox message={(error as Error).message} />
        </View>
      ) : null}

      <View style={styles.statsRow}>
        {[
          { l: "Toplam", v: counts.total },
          { l: "Beklemede", v: counts.pending },
          { l: "Kabul", v: counts.accepted },
          { l: "Red", v: counts.rejected },
        ].map((s) => (
          <Card key={s.l} style={styles.statCard}>
            <Text style={styles.statValue}>{s.v}</Text>
            <Text style={styles.statLabel}>{s.l}</Text>
          </Card>
        ))}
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.value}
            style={[styles.tab, filter === t.value && styles.tabActive]}
            onPress={() => {
              setFilter(t.value);
              setPage(1);
            }}
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
      ) : apps.length === 0 ? (
        <EmptyState
          title="Bu durumda başvuru yok"
          description={
            filter === "ALL"
              ? "Açık projelerine başvuru geldikçe burada görünecek."
              : "Filtreyi değiştirerek diğerlerine bakabilirsin."
          }
        />
      ) : (
        <View style={{ gap: 10, marginTop: 14 }}>
          {apps.map((app: any) => (
            <Card key={app.id}>
              <View style={styles.row}>
                <Avatar name={app.applicant?.name} size={44} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.rowHead}>
                    <Text style={styles.appName}>{app.applicant?.name}</Text>
                    <Badge
                      label={statusLabel(app.status)}
                      tone={tone(app.status)}
                    />
                  </View>
                  <Text style={styles.appMeta}>
                    {app.applicant?.department}
                    {app.applicant?.year
                      ? ` • ${app.applicant.year}. sınıf`
                      : ""}
                    {" • "}
                    {formatDate(app.createdAt)}
                  </Text>
                  {app.applicant?.bio ? (
                    <Text style={styles.bio} numberOfLines={2}>
                      {app.applicant.bio}
                    </Text>
                  ) : null}
                  {app.applicant?.tags?.length ? (
                    <View style={styles.tags}>
                      {app.applicant.tags
                        .slice(0, 5)
                        .map((t: any) => (
                          <TagBadge
                            key={t.id}
                            name={t.name}
                            category={t.category}
                          />
                        ))}
                    </View>
                  ) : null}
                </View>
              </View>

              <Pressable
                style={styles.projectBox}
                onPress={() =>
                  router.push(`/projects/${app.project?.id}` as any)
                }
              >
                <Text style={styles.projectLabel}>Proje</Text>
                <Text style={styles.projectTitle} numberOfLines={2}>
                  {app.project?.title}
                </Text>
              </Pressable>

              {app.message ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteLabel}>Başvuru notu</Text>
                  <Text style={styles.noteText}>{app.message}</Text>
                </View>
              ) : null}

              {app.status === "PENDING" ? (
                <View style={styles.actions}>
                  <Button
                    title="Kabul Et"
                    variant="success"
                    size="sm"
                    onPress={() =>
                      update.mutate({ id: app.id, status: "ACCEPTED" })
                    }
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Reddet"
                    variant="outline"
                    size="sm"
                    onPress={() =>
                      update.mutate({ id: app.id, status: "REJECTED" })
                    }
                    style={{ flex: 1 }}
                  />
                </View>
              ) : (
                <View style={{ marginTop: 10, alignItems: "flex-start" }}>
                  <Button
                    title="Kararı değiştir"
                    variant="ghost"
                    size="sm"
                    onPress={() =>
                      update.mutate({
                        id: app.id,
                        status:
                          app.status === "ACCEPTED" ? "REJECTED" : "ACCEPTED",
                      })
                    }
                  />
                </View>
              )}
            </Card>
          ))}
        </View>
      )}

      {data?.meta && data.meta.totalPages > 1 ? (
        <View style={styles.pager}>
          <Button
            title="Önceki"
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onPress={() => setPage((p) => p - 1)}
          />
          <Text style={styles.pageText}>
            {page} / {data.meta.totalPages}
          </Text>
          <Button
            title="Sonraki"
            size="sm"
            variant="outline"
            disabled={page >= data.meta.totalPages}
            onPress={() => setPage((p) => p + 1)}
          />
        </View>
      ) : null}
    </ScrollView>
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
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: "22%",
    alignItems: "center",
    padding: 10,
  },
  statValue: { fontSize: fonts.size.xl, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: fonts.size.xs, color: colors.textMuted, marginTop: 2 },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, alignItems: "center" },
  tabActive: { backgroundColor: colors.primarySoft },
  tabText: { fontSize: fonts.size.xs, fontWeight: "600", color: colors.textMuted },
  tabTextActive: { color: colors.primary },
  row: { flexDirection: "row", alignItems: "flex-start" },
  rowHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  appName: { fontSize: fonts.size.md, fontWeight: "700", color: colors.text },
  appMeta: { fontSize: fonts.size.xs, color: colors.textMuted, marginTop: 4 },
  bio: { fontSize: fonts.size.sm, color: colors.textMuted, marginTop: 6 },
  tags: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  projectBox: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  projectLabel: { fontSize: fonts.size.xs, color: colors.textMuted },
  projectTitle: { fontSize: fonts.size.sm, fontWeight: "700", color: colors.text },
  noteBox: {
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 10,
  },
  noteLabel: { fontSize: fonts.size.xs, color: colors.textMuted, marginBottom: 4 },
  noteText: { fontSize: fonts.size.sm, color: colors.text },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  pager: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 16,
  },
  pageText: { color: colors.textMuted, fontSize: fonts.size.sm, fontWeight: "600" },
});
