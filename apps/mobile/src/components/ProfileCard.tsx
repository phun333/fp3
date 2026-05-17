import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../lib/theme";
import { Avatar } from "./Avatar";
import { Card } from "./Card";
import { MatchScore } from "./MatchScore";
import { TagBadge } from "./TagBadge";

export interface ProfileCardProps {
  id: string;
  name: string;
  department: string;
  bio?: string | null;
  role: "STUDENT" | "PROFESSOR";
  year?: number | null;
  tags: { id: string; name: string; category?: string | null }[];
  matchScore?: number;
  _count?: { projects?: number; publications?: number };
}

export function ProfileCard(p: ProfileCardProps) {
  const router = useRouter();
  // Öğrenci profilleri için detay sayfası mobilde yok; sadece kart gösteriyoruz.
  const target = p.role === "PROFESSOR" ? `/professors/${p.id}` : null;

  return (
    <Card
      onPress={target ? () => router.push(target as any) : undefined}
      style={{ marginBottom: 12 }}
    >
      <View style={styles.row}>
        <Avatar name={p.name} size={52} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.name} numberOfLines={1}>
            {p.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {p.department}
            {p.year ? ` • ${p.year}. sınıf` : ""}
          </Text>
          {p._count ? (
            <Text style={styles.counts}>
              {(p._count.projects ?? 0)} proje • {(p._count.publications ?? 0)} yayın
            </Text>
          ) : null}
        </View>
      </View>

      {p.bio ? (
        <Text style={styles.bio} numberOfLines={2}>
          {p.bio}
        </Text>
      ) : null}

      {p.tags.length > 0 ? (
        <View style={styles.tags}>
          {p.tags.slice(0, 5).map((t) => (
            <TagBadge key={t.id} name={t.name} category={t.category} />
          ))}
          {p.tags.length > 5 ? (
            <Text style={styles.more}>+{p.tags.length - 5}</Text>
          ) : null}
        </View>
      ) : null}

      {typeof p.matchScore === "number" ? (
        <View style={{ marginTop: 10 }}>
          <MatchScore score={p.matchScore} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: fonts.size.lg, fontWeight: "700", color: colors.text },
  meta: { fontSize: fonts.size.sm, color: colors.textMuted, marginTop: 2 },
  counts: { fontSize: fonts.size.xs, color: colors.textSubtle, marginTop: 4 },
  bio: { marginTop: 10, fontSize: fonts.size.sm, color: colors.textMuted },
  tags: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  more: {
    alignSelf: "center",
    color: colors.textMuted,
    fontSize: fonts.size.xs,
    marginLeft: 2,
  },
});
