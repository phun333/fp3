import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Badge } from "../../src/components/Badge";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { EmptyState, Loading } from "../../src/components/Loading";
import { TagBadge } from "../../src/components/TagBadge";
import { applicationsApi } from "../../src/lib/api";
import { colors, fonts } from "../../src/lib/theme";
import { statusLabel } from "../../src/lib/utils";

const statusTone = (s: string): "success" | "danger" | "secondary" => {
  if (s === "ACCEPTED") return "success";
  if (s === "REJECTED") return "danger";
  return "secondary";
};

export default function MyApplicationsScreen() {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, refetch } = useQuery<any>({
    queryKey: ["my-applications", page],
    queryFn: () => applicationsApi.myApplications(`page=${page}&limit=10`),
  });

  if (isLoading) return <Loading />;
  const apps = data?.data || [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Text style={styles.title}>Başvurularım</Text>

      {apps.length === 0 ? (
        <View style={{ marginTop: 12 }}>
          <EmptyState
            title="Henüz başvurun yok"
            description="Açık projelere göz at ve başvur"
          />
          <View style={{ alignItems: "center", marginTop: 12 }}>
            <Button
              title="Projeleri Gör"
              onPress={() => router.push("/projects" as any)}
            />
          </View>
        </View>
      ) : (
        <View style={{ gap: 10, marginTop: 12 }}>
          {apps.map((app: any) => (
            <Card
              key={app.id}
              onPress={() => router.push(`/projects/${app.project?.id}` as any)}
            >
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.appTitle}>{app.project?.title}</Text>
                  <Text style={styles.appOwner}>
                    {app.project?.owner?.name} •{" "}
                    {app.project?.owner?.department}
                  </Text>
                  {app.message ? (
                    <Text style={styles.appMessage} numberOfLines={2}>
                      {app.message}
                    </Text>
                  ) : null}
                  {app.project?.tags?.length ? (
                    <View style={styles.tags}>
                      {app.project.tags
                        .slice(0, 4)
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
                <Badge
                  label={statusLabel(app.status)}
                  tone={statusTone(app.status)}
                />
              </View>
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
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  appTitle: { fontSize: fonts.size.md, fontWeight: "700", color: colors.text },
  appOwner: { fontSize: fonts.size.xs, color: colors.textMuted, marginTop: 2 },
  appMessage: { marginTop: 6, fontSize: fonts.size.sm, color: colors.text },
  tags: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  pager: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 16,
  },
  pageText: { color: colors.textMuted, fontSize: fonts.size.sm, fontWeight: "600" },
});
