import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
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
import { Section } from "../../src/components/Section";
import { TagBadge } from "../../src/components/TagBadge";
import { invitationsApi, projectsApi, usersApi } from "../../src/lib/api";
import { useAuth } from "../../src/lib/auth-context";
import { colors, fonts, radius } from "../../src/lib/theme";
import { statusLabel } from "../../src/lib/utils";

const tone = (s: string): "default" | "secondary" | "danger" => {
  if (s === "OPEN") return "default";
  if (s === "CLOSED") return "danger";
  return "secondary";
};

export default function MyProjectsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, isFetching, refetch } = useQuery<any>({
    queryKey: ["my-projects"],
    queryFn: () => projectsApi.mine(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-projects"] }),
  });

  const [inviteFor, setInviteFor] = useState<any | null>(null);

  const confirmDelete = (project: any) => {
    Alert.alert(
      "Projeyi sil?",
      `"${project.title}" projesini silmek istediğine emin misin? Tüm başvurular ve davetler silinecek.`,
      [
        { text: "İptal", style: "cancel" },
        { text: "Sil", style: "destructive", onPress: () => remove.mutate(project.id) },
      ]
    );
  };

  const projects: any[] = data?.data || [];
  const owned = projects.filter((p) => p.isOwner);
  const joined = projects.filter((p) => !p.isOwner);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Projelerim</Text>
        {user?.role === "PROFESSOR" ? (
          <Button
            title="+ Yeni"
            size="sm"
            onPress={() => router.push("/projects/new")}
          />
        ) : null}
      </View>

      {isLoading ? (
        <Loading />
      ) : projects.length === 0 ? (
        <View style={{ marginTop: 20 }}>
          <EmptyState title="Henüz hiçbir projede yer almıyorsun" />
          <View style={{ alignItems: "center", marginTop: 12 }}>
            <Button
              title={user?.role === "PROFESSOR" ? "Yeni Proje" : "Projeleri Keşfet"}
              onPress={() =>
                router.push(
                  user?.role === "PROFESSOR" ? "/projects/new" : "/projects"
                )
              }
            />
          </View>
        </View>
      ) : (
        <View>
          {owned.length > 0 ? (
            <Section title={`Sahibi olduklarım (${owned.length})`}>
              {owned.map((p) => (
                <OwnerCard
                  key={p.id}
                  project={p}
                  onOpen={() => router.push(`/projects/${p.id}` as any)}
                  onInvite={() => setInviteFor(p)}
                  onDelete={() => confirmDelete(p)}
                  deleting={remove.isPending}
                />
              ))}
            </Section>
          ) : null}

          {joined.length > 0 ? (
            <Section title={`Üyesi olduklarım (${joined.length})`}>
              {joined.map((p) => (
                <Card
                  key={p.id}
                  style={{ marginBottom: 10 }}
                  onPress={() => router.push(`/projects/${p.id}` as any)}
                >
                  <ProjectMeta project={p} />
                </Card>
              ))}
            </Section>
          ) : null}
        </View>
      )}

      {inviteFor ? (
        <InviteModal
          project={inviteFor}
          onClose={() => setInviteFor(null)}
        />
      ) : null}
    </ScrollView>
  );
}

function ProjectMeta({ project }: { project: any }) {
  const studentCount =
    project.members?.filter((m: any) => m.role === "STUDENT").length || 0;
  const profCount =
    project.members?.filter((m: any) => m.role === "PROFESSOR").length || 0;
  return (
    <View>
      <View style={styles.metaHeader}>
        <Text style={styles.metaTitle}>{project.title}</Text>
        <Badge label={statusLabel(project.status)} tone={tone(project.status)} />
      </View>
      <Text style={styles.desc} numberOfLines={2}>
        {project.description}
      </Text>
      {project.tags?.length ? (
        <View style={styles.tags}>
          {project.tags.slice(0, 4).map((t: any) => (
            <TagBadge key={t.id} name={t.name} category={t.category} />
          ))}
        </View>
      ) : null}
      <View style={styles.capacityRow}>
        <Text style={styles.capacityText}>
          Hoca: {profCount}/{project.professorSlots}
        </Text>
        <Text style={styles.capacityText}>
          Öğrenci: {studentCount}/{project.studentSlots}
        </Text>
      </View>
    </View>
  );
}

function OwnerCard({
  project,
  onOpen,
  onInvite,
  onDelete,
  deleting,
}: {
  project: any;
  onOpen: () => void;
  onInvite: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <Card style={{ marginBottom: 10 }}>
      <Pressable onPress={onOpen}>
        <ProjectMeta project={project} />
      </Pressable>
      <View style={styles.actions}>
        <Button
          title="Davet Et"
          size="sm"
          onPress={onInvite}
          style={{ flex: 1 }}
        />
        <Button
          title="Detay"
          variant="outline"
          size="sm"
          onPress={onOpen}
          style={{ flex: 1 }}
        />
        <Button
          title={deleting ? "..." : "Sil"}
          variant="danger"
          size="sm"
          onPress={onDelete}
          disabled={deleting}
        />
      </View>
    </Card>
  );
}

function InviteModal({
  project,
  onClose,
}: {
  project: any;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "STUDENT" | "PROFESSOR">(
    "ALL"
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { data: searchData } = useQuery<any>({
    queryKey: ["users-search", query, roleFilter],
    queryFn: () =>
      usersApi.search(
        query,
        roleFilter === "ALL" ? undefined : roleFilter,
        15
      ),
    enabled: query.length > 0,
  });

  const send = useMutation({
    mutationFn: (userId: string) =>
      invitationsApi.send(project.id, {
        userId,
        message: message || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-projects"] });
      qc.invalidateQueries({ queryKey: ["users-search"] });
      onClose();
    },
    onError: (e: any) => setError(e.message || "Davet gönderilemedi"),
  });

  const users: any[] = searchData?.data || [];
  const memberIds = new Set(project?.members?.map((m: any) => m.user?.id) || []);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.sheetTitle}>Üye Davet Et</Text>
          <Text style={styles.sheetSub}>{project?.title}</Text>

          {error ? <ErrorBox message={error} /> : null}

          <Input
            placeholder="İsim, e-posta veya bölüm ara..."
            value={query}
            onChangeText={setQuery}
            containerStyle={{ marginBottom: 10 }}
          />

          <View style={styles.filterRow}>
            {(
              [
                { v: "ALL", l: "Tümü" },
                { v: "STUDENT", l: "Öğrenci" },
                { v: "PROFESSOR", l: "Akademisyen" },
              ] as const
            ).map((f) => (
              <Pressable
                key={f.v}
                onPress={() => setRoleFilter(f.v as any)}
                style={[
                  styles.filterChip,
                  roleFilter === f.v && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    roleFilter === f.v && styles.filterTextActive,
                  ]}
                >
                  {f.l}
                </Text>
              </Pressable>
            ))}
          </View>

          <Input
            placeholder="Davet mesajı (opsiyonel)"
            value={message}
            onChangeText={setMessage}
            multiline
            containerStyle={{ marginBottom: 10 }}
          />

          <ScrollView style={{ maxHeight: 280 }}>
            {query.length === 0 ? (
              <Text style={styles.empty}>Aramak için isim yaz</Text>
            ) : users.length === 0 ? (
              <Text style={styles.empty}>Sonuç yok</Text>
            ) : (
              users.map((u: any) => {
                const isMember = memberIds.has(u.id);
                return (
                  <View key={u.id} style={styles.userRow}>
                    <Avatar name={u.name} size={36} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {u.name}
                      </Text>
                      <Text style={styles.userMeta} numberOfLines={1}>
                        {u.role === "PROFESSOR" ? "Akademisyen" : "Öğrenci"} •{" "}
                        {u.department}
                      </Text>
                    </View>
                    {isMember ? (
                      <Badge label="Üye" tone="secondary" />
                    ) : (
                      <Button
                        title="Davet"
                        size="sm"
                        loading={send.isPending}
                        onPress={() => send.mutate(u.id)}
                      />
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={{ marginTop: 12 }}>
            <Button title="Kapat" variant="outline" onPress={onClose} fullWidth />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: fonts.size.xxl, fontWeight: "800", color: colors.text },
  metaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  metaTitle: {
    fontSize: fonts.size.md,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  desc: {
    marginTop: 6,
    fontSize: fonts.size.sm,
    color: colors.textMuted,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  capacityRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  capacityText: { fontSize: fonts.size.xs, color: colors.textSubtle },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  sheet: {
    width: "100%",
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: 16,
    maxHeight: "92%",
  },
  sheetTitle: { fontSize: fonts.size.lg, fontWeight: "700", color: colors.text },
  sheetSub: {
    fontSize: fonts.size.sm,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  filterRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: { fontSize: fonts.size.xs, color: colors.text, fontWeight: "600" },
  filterTextActive: { color: "#fff" },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userName: { fontSize: fonts.size.sm, fontWeight: "600", color: colors.text },
  userMeta: { fontSize: fonts.size.xs, color: colors.textMuted },
  empty: {
    paddingVertical: 24,
    textAlign: "center",
    color: colors.textMuted,
    fontSize: fonts.size.sm,
  },
});
