import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Avatar } from "../../../src/components/Avatar";
import { Badge } from "../../../src/components/Badge";
import { Button } from "../../../src/components/Button";
import { Card } from "../../../src/components/Card";
import { Input } from "../../../src/components/Input";
import { EmptyState, ErrorBox, Loading } from "../../../src/components/Loading";
import { Section } from "../../../src/components/Section";
import { TagBadge } from "../../../src/components/TagBadge";
import { applicationsApi, projectsApi } from "../../../src/lib/api";
import { useAuth } from "../../../src/lib/auth-context";
import { colors, fonts } from "../../../src/lib/theme";
import { statusLabel } from "../../../src/lib/utils";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const [showApply, setShowApply] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery<any>({
    queryKey: ["project", id],
    queryFn: () => projectsApi.getById(id as string),
    enabled: !!id,
  });

  const apply = useMutation({
    mutationFn: () =>
      applicationsApi.apply(id as string, {
        message: message || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", id] });
      qc.invalidateQueries({ queryKey: ["my-applications"] });
      setShowApply(false);
      setMessage("");
    },
    onError: (e: any) => setError(e.message || "Başvuru gönderilemedi"),
  });

  const statusMut = useMutation({
    mutationFn: ({ appId, status }: { appId: string; status: string }) =>
      applicationsApi.updateStatus(appId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project", id] }),
  });

  const remove = useMutation({
    mutationFn: () => projectsApi.remove(id as string),
    onSuccess: () => router.back(),
  });

  if (isLoading) return <Loading />;
  const project = data?.data;
  if (!project) return <EmptyState title="Proje bulunamadı" />;

  const isOwner = user?.id === project.owner?.id;
  const isMember = project.members?.some((m: any) => m.user?.id === user?.id);
  const alreadyApplied = project.applications?.some(
    (a: any) => a.applicant?.id === user?.id
  );
  const studentCount =
    project.members?.filter((m: any) => m.role === "STUDENT").length || 0;
  const profCount =
    project.members?.filter((m: any) => m.role === "PROFESSOR").length || 0;
  const canApply =
    !isOwner && !isMember && !alreadyApplied && project.status === "OPEN";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Card style={{ marginBottom: 16 }}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{project.title}</Text>
          <Badge
            label={statusLabel(project.status)}
            tone={
              project.status === "OPEN"
                ? "default"
                : project.status === "CLOSED"
                ? "danger"
                : "secondary"
            }
          />
        </View>
        <Text style={styles.owner}>
          {project.owner?.name} • {project.owner?.department}
        </Text>
        <Text style={styles.desc}>{project.description}</Text>

        {project.tags?.length > 0 ? (
          <View style={styles.tags}>
            {project.tags.map((t: any) => (
              <TagBadge key={t.id} name={t.name} category={t.category} />
            ))}
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            Hoca: {profCount}/{project.professorSlots}
          </Text>
          <Text style={styles.metaText}>
            Öğrenci: {studentCount}/{project.studentSlots}
          </Text>
          <Text style={styles.metaText}>
            {project._count?.applications ?? 0} başvuru
          </Text>
        </View>

        {error ? (
          <View style={{ marginTop: 12 }}>
            <ErrorBox message={error} />
          </View>
        ) : null}

        {canApply ? (
          <View style={{ marginTop: 16 }}>
            {showApply ? (
              <View style={{ gap: 10 }}>
                <Input
                  label="Başvuru notu (opsiyonel)"
                  multiline
                  placeholder="Neden bu projeye katılmak istiyorsun?"
                  value={message}
                  onChangeText={setMessage}
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Button
                    title={apply.isPending ? "Gönderiliyor..." : "Gönder"}
                    loading={apply.isPending}
                    onPress={() => apply.mutate()}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="İptal"
                    variant="outline"
                    onPress={() => setShowApply(false)}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            ) : (
              <Button
                title="Bu Projeye Başvur"
                onPress={() => {
                  setError("");
                  setShowApply(true);
                }}
                fullWidth
              />
            )}
          </View>
        ) : null}

        {alreadyApplied && !isMember ? (
          <Text style={styles.applied}>✓ Bu projeye zaten başvurdun</Text>
        ) : null}
        {isMember && !isOwner ? (
          <Text style={styles.applied}>✓ Bu projenin üyesisin</Text>
        ) : null}

        {isOwner ? (
          <View style={{ marginTop: 16 }}>
            <Button
              title={remove.isPending ? "Siliniyor..." : "Projeyi Sil"}
              variant="danger"
              size="sm"
              onPress={() => remove.mutate()}
              loading={remove.isPending}
            />
          </View>
        ) : null}
      </Card>

      {project.members?.length > 0 ? (
        <Section title={`Üyeler (${project.members.length})`}>
          {project.members.map((m: any) => (
            <Card key={m.id} style={{ marginBottom: 8 }}>
              <View style={styles.appRow}>
                <Avatar name={m.user?.name} size={40} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.appName}>
                    {m.user?.name}
                    {m.user?.id === project.owner?.id ? (
                      <Text style={{ color: colors.primary }}> (Sahip)</Text>
                    ) : null}
                  </Text>
                  <Text style={styles.appMeta}>
                    {m.role === "PROFESSOR" ? "Akademisyen" : "Öğrenci"}
                    {m.user?.department ? ` • ${m.user.department}` : ""}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </Section>
      ) : null}

      {isOwner && project.applications?.length > 0 ? (
        <Section title={`Başvurular (${project.applications.length})`}>
          {project.applications.map((app: any) => (
            <Card key={app.id} style={{ marginBottom: 10 }}>
              <View style={styles.appRow}>
                <Avatar name={app.applicant?.name} size={44} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.appName}>{app.applicant?.name}</Text>
                  <Text style={styles.appMeta}>
                    {app.applicant?.department}
                  </Text>
                  {app.message ? (
                    <Text style={styles.appMessage}>{app.message}</Text>
                  ) : null}
                </View>
              </View>
              {app.status === "PENDING" ? (
                <View style={styles.appBtnRow}>
                  <Button
                    title="Kabul Et"
                    size="sm"
                    variant="success"
                    onPress={() =>
                      statusMut.mutate({ appId: app.id, status: "ACCEPTED" })
                    }
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Reddet"
                    size="sm"
                    variant="outline"
                    onPress={() =>
                      statusMut.mutate({ appId: app.id, status: "REJECTED" })
                    }
                    style={{ flex: 1 }}
                  />
                </View>
              ) : (
                <View style={{ marginTop: 10 }}>
                  <Badge
                    label={statusLabel(app.status)}
                    tone={app.status === "ACCEPTED" ? "success" : "danger"}
                  />
                </View>
              )}
            </Card>
          ))}
        </Section>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  title: {
    fontSize: fonts.size.xl,
    fontWeight: "800",
    color: colors.text,
    flex: 1,
  },
  owner: { fontSize: fonts.size.sm, color: colors.primary, marginTop: 4 },
  desc: {
    fontSize: fonts.size.sm,
    color: colors.text,
    marginTop: 12,
    lineHeight: 20,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  metaRow: { flexDirection: "row", gap: 16, marginTop: 12 },
  metaText: { fontSize: fonts.size.xs, color: colors.textSubtle },
  applied: { marginTop: 12, fontSize: fonts.size.sm, color: colors.success },
  appRow: { flexDirection: "row", alignItems: "center" },
  appName: { fontSize: fonts.size.md, fontWeight: "600", color: colors.text },
  appMeta: { fontSize: fonts.size.xs, color: colors.textMuted, marginTop: 2 },
  appMessage: { fontSize: fonts.size.sm, marginTop: 6, color: colors.text },
  appBtnRow: { flexDirection: "row", gap: 8, marginTop: 10 },
});
