import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "../../../src/components/Button";
import { Input } from "../../../src/components/Input";
import { EmptyState, Loading } from "../../../src/components/Loading";
import { ProfileCard } from "../../../src/components/ProfileCard";
import { professorsApi } from "../../../src/lib/api";
import { colors, fonts } from "../../../src/lib/theme";

export default function ProfessorsTab() {
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
    queryKey: ["professors", page, search],
    queryFn: () => professorsApi.list(params),
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Text style={styles.title}>Akademisyenler</Text>
      <Input
        placeholder="İsim, bölüm veya alan ara..."
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
        data.data.map((p: any) => <ProfileCard key={p.id} {...p} />)
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
  title: { fontSize: fonts.size.xxl, fontWeight: "800", color: colors.text },
  pager: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 16,
  },
  pageText: { color: colors.textMuted, fontSize: fonts.size.sm, fontWeight: "600" },
});
