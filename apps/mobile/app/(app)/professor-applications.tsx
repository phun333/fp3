import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { EmptyState, ErrorBox, Loading } from "../../src/components/Loading";
import { TagBadge } from "../../src/components/TagBadge";
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

export default function ProfessorApplicationsScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading, isFetching, refetch, error } = useQuery<any>({
    queryKey: ["professor-applications-incoming"],
    queryFn: () => professorApplicationsApi.incoming(),
  });

  const respond = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "ACCEPTED" | "REJECTED";
    }) => professorApplicationsApi.respond(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["professor-applications-incoming"] });
      qc.invalidateQueries({ queryKey: ["my-projects"] });
    },
  });

  const apps: any[] = data?.data || [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Text style={styles.title}>Öğrenci Talepleri</Text>
      <Text style={styles.subtitle}>
        Eşleştirme üzerinden sana gönderilen proje önerileri.{" "}
        <Text style={{ fontWeight: "700", color: colors.text }}>
          Kabul edersen otomatik proje açılır
        </Text>{" "}
        ve öğrenci üye olur.
      </Text>

      {error ? (
        <View style={{ marginBottom: 12 }}>
          <ErrorBox message={(error as Error).message} />
        </View>
      ) : null}

      {isLoading ? (
        <Loading />
      ) : apps.length === 0 ? (
        <EmptyState
          title="Henüz öğrenci talebi yok"
          description="Öğrenciler matching üzerinden sana proje önerdiğinde burada görünecek."
        />
      ) : (
        <View style={{ gap: 10 }}>
          {apps.map((app) => (
            <Card key={app.id}>
              <View style={styles.row}>
                <Avatar name={app.student?.name} size={44} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.headRow}>
                    <Text style={styles.name}>{app.student?.name}</Text>
                    <Badge label={label(app.status)} tone={tone(app.status)} />
                  </View>
                  <Text style={styles.meta}>
                    {app.student?.department}
                    {app.student?.year ? ` • ${app.student.year}. sınıf` : ""}
                    {" • "}
                    {formatDate(app.createdAt)}
                  </Text>
                  <View style={{ marginTop: 6, flexDirection: "row" }}>
                    <Badge
                      label={app.purpose === "ARTICLE" ? "Makale" : "Proje"}
                      tone="secondary"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.projectBox}>
                <Text style={styles.projectLabel}>Önerilen başlık</Text>
                <Text style={styles.projectTitle}>{app.title}</Text>
                <Text style={styles.desc}>{app.description}</Text>
                {app.tags?.length ? (
                  <View style={styles.tags}>
                    {app.tags.map((t: any) => (
                      <TagBadge key={t.id} name={t.name} category={t.category} />
                    ))}
                  </View>
                ) : null}
              </View>

              {app.message ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteLabel}>Mesaj</Text>
                  <Text style={styles.noteText}>{app.message}</Text>
                </View>
              ) : null}

              {app.status === "PENDING" ? (
                <View style={styles.actions}>
                  <Button
                    title="Kabul Et (Proje Aç)"
                    variant="success"
                    size="sm"
                    disabled={respond.isPending}
                    onPress={() =>
                      respond.mutate({ id: app.id, status: "ACCEPTED" })
                    }
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Reddet"
                    variant="outline"
                    size="sm"
                    disabled={respond.isPending}
                    onPress={() =>
                      respond.mutate({ id: app.id, status: "REJECTED" })
                    }
                    style={{ flex: 1 }}
                  />
                </View>
              ) : app.status === "ACCEPTED" && app.createdProjectId ? (
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
  tags: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
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
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
});
