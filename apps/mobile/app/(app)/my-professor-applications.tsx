import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
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
import { EmptyState, Loading } from "../../src/components/Loading";
import { professorApplicationsApi } from "../../src/lib/api";
import { colors, fonts, radius } from "../../src/lib/theme";
import { formatDate } from "../../src/lib/utils";

const tone = (s: string): "success" | "danger" | "secondary" => {
  if (s === "ACCEPTED") return "success";
  if (s === "REJECTED") return "danger";
  return "secondary";
};

const label = (s: string): string => {
  if (s === "ACCEPTED") return "Kabul Edildi";
  if (s === "REJECTED") return "Reddedildi";
  return "Beklemede";
};

export default function MyProfessorApplicationsScreen() {
  const router = useRouter();

  const { data, isLoading, isFetching, refetch } = useQuery<any>({
    queryKey: ["my-professor-applications"],
    queryFn: () => professorApplicationsApi.mine(),
  });

  const apps: any[] = data?.data || [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Text style={styles.title}>Hoca Başvurularım</Text>
      <Text style={styles.subtitle}>
        Matching üzerinden hocalara gönderdiğin proje önerileri.
      </Text>

      {isLoading ? (
        <Loading />
      ) : apps.length === 0 ? (
        <View>
          <EmptyState
            title="Henüz hocaya başvurmadın"
            description="Eşleştirme ekranından bir hocaya proje önerisi gönderebilirsin."
          />
          <View style={{ alignItems: "center", marginTop: 8 }}>
            <Button
              title="Eşleştirmeye Git"
              variant="primary"
              onPress={() => router.push("/matching" as any)}
            />
          </View>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {apps.map((app) => (
            <Card key={app.id}>
              <View style={styles.row}>
                <Avatar name={app.professor?.name} size={44} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.headRow}>
                    <Text style={styles.name}>{app.professor?.name}</Text>
                    <Badge label={label(app.status)} tone={tone(app.status)} />
                  </View>
                  <Text style={styles.meta}>
                    {app.professor?.department}
                    {" • "}
                    {formatDate(app.createdAt)}
                  </Text>
                </View>
              </View>

              <View style={styles.projectBox}>
                <Text style={styles.projectLabel}>Önerin</Text>
                <Text style={styles.projectTitle}>{app.title}</Text>
                <Text style={styles.desc} numberOfLines={3}>
                  {app.description}
                </Text>
              </View>

              {app.message ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteLabel}>Mesajın</Text>
                  <Text style={styles.noteText}>{app.message}</Text>
                </View>
              ) : null}

              {app.status === "ACCEPTED" && app.createdProjectId ? (
                <View style={{ marginTop: 10, alignItems: "flex-start" }}>
                  <Button
                    title="Oluşturulan projeyi aç →"
                    variant="outline"
                    size="sm"
                    onPress={() =>
                      router.push(`/projects/${app.createdProjectId}` as any)
                    }
                  />
                </View>
              ) : null}
            </Card>
          ))}
        </View>
      )}
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
  row: { flexDirection: "row", alignItems: "flex-start" },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: { fontSize: fonts.size.md, fontWeight: "700", color: colors.text },
  meta: { fontSize: fonts.size.xs, color: colors.textMuted, marginTop: 4 },
  projectBox: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  projectLabel: { fontSize: fonts.size.xs, color: colors.textMuted },
  projectTitle: {
    fontSize: fonts.size.sm,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
  },
  desc: {
    fontSize: fonts.size.sm,
    color: colors.textMuted,
    marginTop: 6,
  },
  noteBox: {
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 10,
  },
  noteLabel: {
    fontSize: fonts.size.xs,
    color: colors.textMuted,
    marginBottom: 4,
  },
  noteText: { fontSize: fonts.size.sm, color: colors.text },
});
