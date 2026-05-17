import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Avatar } from "../../../src/components/Avatar";
import { Card } from "../../../src/components/Card";
import { EmptyState, Loading } from "../../../src/components/Loading";
import { ProjectCard } from "../../../src/components/ProjectCard";
import { Section } from "../../../src/components/Section";
import { TagBadge } from "../../../src/components/TagBadge";
import { professorsApi } from "../../../src/lib/api";
import { colors, fonts } from "../../../src/lib/theme";

export default function ProfessorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading } = useQuery<any>({
    queryKey: ["professor", id],
    queryFn: () => professorsApi.getById(id as string),
    enabled: !!id,
  });

  if (isLoading) return <Loading />;
  const prof = data?.data;
  if (!prof) return <EmptyState title="Akademisyen bulunamadı" />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Card style={{ marginBottom: 16 }}>
        <View style={styles.row}>
          <Avatar name={prof.name} size={72} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.name}>{prof.name}</Text>
            <Text style={styles.meta}>{prof.department}</Text>
            <Text style={styles.meta}>{prof.email}</Text>
          </View>
        </View>
        {prof.bio ? <Text style={styles.bio}>{prof.bio}</Text> : null}
        {prof.tags?.length > 0 ? (
          <View style={styles.tags}>
            {prof.tags.map((t: any) => (
              <TagBadge key={t.id} name={t.name} category={t.category} />
            ))}
          </View>
        ) : null}
      </Card>

      {prof.projects?.length > 0 ? (
        <Section title={`Projeler (${prof.projects.length})`}>
          {prof.projects.map((p: any) => (
            <ProjectCard
              key={p.id}
              {...p}
              owner={{
                id: prof.id,
                name: prof.name,
                department: prof.department,
              }}
            />
          ))}
        </Section>
      ) : null}

      {prof.publications?.length > 0 ? (
        <Section title={`Yayınlar (${prof.publications.length})`}>
          {prof.publications.map((pub: any) => (
            <Card key={pub.id} style={{ marginBottom: 10 }}>
              <Text style={styles.pubTitle}>{pub.title}</Text>
              {pub.year ? <Text style={styles.pubYear}>{pub.year}</Text> : null}
              {pub.abstract ? (
                <Text style={styles.pubAbstract} numberOfLines={3}>
                  {pub.abstract}
                </Text>
              ) : null}
              {pub.tags?.length ? (
                <View style={styles.tags}>
                  {pub.tags.map((t: any) => (
                    <TagBadge key={t.id} name={t.name} category={t.category} />
                  ))}
                </View>
              ) : null}
            </Card>
          ))}
        </Section>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: fonts.size.xl, fontWeight: "800", color: colors.text },
  meta: { fontSize: fonts.size.sm, color: colors.textMuted, marginTop: 2 },
  bio: {
    marginTop: 12,
    fontSize: fonts.size.sm,
    lineHeight: 20,
    color: colors.text,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  pubTitle: { fontSize: fonts.size.md, fontWeight: "700", color: colors.text },
  pubYear: { fontSize: fonts.size.xs, color: colors.textMuted, marginTop: 2 },
  pubAbstract: {
    fontSize: fonts.size.sm,
    color: colors.textMuted,
    marginTop: 6,
  },
});
