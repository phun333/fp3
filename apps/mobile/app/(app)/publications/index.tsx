import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "../../../src/components/Button";
import { Card } from "../../../src/components/Card";
import { Input } from "../../../src/components/Input";
import { EmptyState, Loading } from "../../../src/components/Loading";
import { TagBadge } from "../../../src/components/TagBadge";
import { publicationsApi } from "../../../src/lib/api";
import { useAuth } from "../../../src/lib/auth-context";
import { colors, fonts } from "../../../src/lib/theme";

export default function PublicationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", "12");
    if (search) p.set("search", search);
    return p.toString();
  }, [page, search]);

  const { data, isLoading, isFetching, refetch } = useQuery<any>({
    queryKey: ["publications", page, search],
    queryFn: () => publicationsApi.list(params),
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Yayınlar</Text>
        {user?.role === "PROFESSOR" ? (
          <Button
            title="+ Ekle"
            size="sm"
            onPress={() => router.push("/publications/new")}
          />
        ) : null}
      </View>

      <Input
        placeholder="Yayın ara..."
        value={search}
        onChangeText={(v) => {
          setSearch(v);
          setPage(1);
        }}
        containerStyle={{ marginVertical: 12 }}
      />

      {isLoading ? (
        <Loading />
      ) : (data?.data?.length ?? 0) === 0 ? (
        <EmptyState title="Sonuç yok" />
      ) : (
        data.data.map((pub: any) => (
          <Card key={pub.id} style={{ marginBottom: 10 }}>
            <Text style={styles.pubTitle}>{pub.title}</Text>
            <Text style={styles.pubMeta}>
              {pub.author?.name} {pub.year ? `• ${pub.year}` : ""}
            </Text>
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
            {pub.url ? (
              <View style={{ marginTop: 10, alignItems: "flex-start" }}>
                <Button
                  title="Yayını Aç"
                  variant="outline"
                  size="sm"
                  onPress={() => Linking.openURL(pub.url)}
                />
              </View>
            ) : null}
          </Card>
        ))
      )}

      {data?.meta && data.meta.totalPages > 1 ? (
        <View style={styles.pager}>
          <Button
            title="Önceki"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onPress={() => setPage((p) => p - 1)}
          />
          <Text style={styles.pageText}>
            {page} / {data.meta.totalPages}
          </Text>
          <Button
            title="Sonraki"
            variant="outline"
            size="sm"
            disabled={page >= data.meta.totalPages}
            onPress={() => setPage((p) => p + 1)}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: fonts.size.xxl, fontWeight: "800", color: colors.text },
  pubTitle: { fontSize: fonts.size.md, fontWeight: "700", color: colors.text },
  pubMeta: { fontSize: fonts.size.xs, color: colors.textMuted, marginTop: 2 },
  pubAbstract: {
    fontSize: fonts.size.sm,
    color: colors.textMuted,
    marginTop: 6,
  },
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
