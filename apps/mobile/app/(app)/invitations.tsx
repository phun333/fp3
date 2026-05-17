import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
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
import { EmptyState, Loading } from "../../src/components/Loading";
import { TagBadge } from "../../src/components/TagBadge";
import { invitationsApi } from "../../src/lib/api";
import { colors, fonts, radius } from "../../src/lib/theme";

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

export default function InvitationsScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading, isFetching, refetch } = useQuery<any>({
    queryKey: ["invitations"],
    queryFn: () => invitationsApi.mine(),
  });

  const respond = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "ACCEPTED" | "REJECTED";
    }) => invitationsApi.respond(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
      qc.invalidateQueries({ queryKey: ["my-projects"] });
    },
  });

  const invites: any[] = data?.data || [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Text style={styles.title}>Davetlerim</Text>
      <Text style={styles.subtitle}>
        Sana gelen proje davetleri burada listelenir.
      </Text>

      {isLoading ? (
        <Loading />
      ) : invites.length === 0 ? (
        <EmptyState title="Henüz davet almadın" />
      ) : (
        invites.map((inv) => (
          <Card key={inv.id} style={{ marginBottom: 12 }}>
            <View style={styles.row}>
              <Avatar name={inv.inviter?.name} size={44} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.headRow}>
                  <Text style={styles.inviter}>{inv.inviter?.name}</Text>
                  <Badge label={label(inv.status)} tone={tone(inv.status)} />
                </View>
                <Text style={styles.meta}>{inv.inviter?.department}</Text>
              </View>
            </View>

            <Pressable
              style={styles.projectBox}
              onPress={() => router.push(`/projects/${inv.project?.id}` as any)}
            >
              <Text style={styles.projectLabel}>Proje</Text>
              <Text style={styles.projectTitle}>{inv.project?.title}</Text>
              {inv.project?.tags?.length ? (
                <View style={styles.tags}>
                  {inv.project.tags.slice(0, 4).map((t: any) => (
                    <TagBadge key={t.id} name={t.name} category={t.category} />
                  ))}
                </View>
              ) : null}
            </Pressable>

            {inv.message ? (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>Davet mesajı</Text>
                <Text style={styles.noteText}>{inv.message}</Text>
              </View>
            ) : null}

            <Text style={styles.role}>
              Davet edildiğin rol:{" "}
              <Text style={{ fontWeight: "700" }}>
                {inv.invitedRole === "PROFESSOR" ? "Akademisyen" : "Öğrenci"}
              </Text>
            </Text>

            {inv.status === "PENDING" ? (
              <View style={styles.actions}>
                <Button
                  title="Kabul Et"
                  variant="success"
                  size="sm"
                  onPress={() =>
                    respond.mutate({ id: inv.id, status: "ACCEPTED" })
                  }
                  style={{ flex: 1 }}
                />
                <Button
                  title="Reddet"
                  variant="outline"
                  size="sm"
                  onPress={() =>
                    respond.mutate({ id: inv.id, status: "REJECTED" })
                  }
                  style={{ flex: 1 }}
                />
              </View>
            ) : null}
          </Card>
        ))
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
  row: { flexDirection: "row", alignItems: "center" },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  inviter: { fontSize: fonts.size.md, fontWeight: "700", color: colors.text },
  meta: { fontSize: fonts.size.xs, color: colors.textMuted, marginTop: 2 },
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
    fontSize: fonts.size.md,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
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
  role: { marginTop: 8, fontSize: fonts.size.xs, color: colors.textMuted },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
});
