import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../lib/theme";
import { statusLabel } from "../lib/utils";
import { Badge } from "./Badge";
import { Card } from "./Card";
import { MatchScore } from "./MatchScore";
import { TagBadge } from "./TagBadge";

export interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  status: string;
  studentSlots?: number;
  professorSlots?: number;
  owner: { id: string; name: string; department?: string };
  tags: { id: string; name: string; category?: string | null }[];
  _count?: { applications?: number; members?: number };
  matchScore?: number;
}

const statusTone = (status: string): "default" | "secondary" | "danger" => {
  switch (status) {
    case "OPEN":
      return "default";
    case "IN_PROGRESS":
      return "secondary";
    case "CLOSED":
      return "danger";
    default:
      return "secondary";
  }
};

export function ProjectCard(p: ProjectCardProps) {
  const router = useRouter();
  return (
    <Card
      onPress={() => router.push(`/projects/${p.id}` as any)}
      style={{ marginBottom: 12 }}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={2}>
          {p.title}
        </Text>
        <Badge label={statusLabel(p.status)} tone={statusTone(p.status)} />
      </View>
      <Text style={styles.owner}>{p.owner?.name}</Text>
      <Text style={styles.desc} numberOfLines={3}>
        {p.description}
      </Text>

      {p.tags.length > 0 ? (
        <View style={styles.tags}>
          {p.tags.slice(0, 4).map((t) => (
            <TagBadge key={t.id} name={t.name} category={t.category} />
          ))}
          {p.tags.length > 4 ? (
            <Text style={styles.more}>+{p.tags.length - 4}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {(p._count?.members ?? 0)}/
          {(p.studentSlots ?? 0) + (p.professorSlots ?? 0)} üye
        </Text>
        {typeof p._count?.applications === "number" ? (
          <Text style={styles.footerText}>{p._count.applications} başvuru</Text>
        ) : null}
      </View>

      {typeof p.matchScore === "number" ? (
        <View style={{ marginTop: 10 }}>
          <MatchScore score={p.matchScore} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  title: {
    fontSize: fonts.size.lg,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  owner: { fontSize: fonts.size.sm, color: colors.textMuted, marginTop: 4 },
  desc: { fontSize: fonts.size.sm, color: colors.textMuted, marginTop: 8 },
  tags: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  more: {
    alignSelf: "center",
    color: colors.textMuted,
    fontSize: fonts.size.xs,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 16,
    marginTop: 10,
  },
  footerText: { fontSize: fonts.size.xs, color: colors.textSubtle },
});
