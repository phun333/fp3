import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { EmptyState, ErrorBox, Loading } from "../../src/components/Loading";
import { ProfileCard } from "../../src/components/ProfileCard";
import { ProjectCard } from "../../src/components/ProjectCard";
import { discoverApi } from "../../src/lib/api";
import { useAuth } from "../../src/lib/auth-context";
import { colors, fonts, radius } from "../../src/lib/theme";

type Tab = "projects" | "professors";

export default function DiscoverScreen() {
  const { user } = useAuth();
  const isProf = user?.role === "PROFESSOR";
  const [tab, setTab] = useState<Tab>("projects");

  const profQ = useQuery<any>({
    queryKey: ["discover-professors"],
    queryFn: () => discoverApi.professors("limit=20"),
    enabled: !isProf,
  });
  const projQ = useQuery<any>({
    queryKey: ["discover-projects"],
    queryFn: () => discoverApi.projects("limit=20"),
    enabled: !isProf,
  });
  const stuQ = useQuery<any>({
    queryKey: ["discover-students"],
    queryFn: () => discoverApi.students("limit=20"),
    enabled: isProf,
  });

  if (isProf) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.surface }}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={stuQ.isFetching} onRefresh={() => stuQ.refetch()} />
        }
      >
        <Text style={styles.title}>Önerilen Öğrenciler</Text>
        <Text style={styles.subtitle}>
          Tag eşleşmesine göre sana uygun öğrenciler
        </Text>
        {stuQ.error ? (
          <ErrorBox message={(stuQ.error as Error).message} />
        ) : null}
        {stuQ.isLoading ? (
          <Loading />
        ) : (stuQ.data?.data?.length ?? 0) === 0 ? (
          <EmptyState
            title="Henüz öneri yok"
            description="Profilinize tag ekleyerek öneri almaya başlayın"
          />
        ) : (
          stuQ.data.data.map((s: any) => <ProfileCard key={s.id} {...s} />)
        )}
      </ScrollView>
    );
  }

  const isLoading = tab === "projects" ? projQ.isLoading : profQ.isLoading;
  const items = tab === "projects" ? projQ.data?.data : profQ.data?.data;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={projQ.isFetching || profQ.isFetching}
          onRefresh={() => {
            projQ.refetch();
            profQ.refetch();
          }}
        />
      }
    >
      <Text style={styles.title}>Keşfet</Text>
      <Text style={styles.subtitle}>
        Sana önerilen projeler ve akademisyenler
      </Text>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === "projects" && styles.tabActive]}
          onPress={() => setTab("projects")}
        >
          <Text
            style={[styles.tabText, tab === "projects" && styles.tabTextActive]}
          >
            Projeler
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "professors" && styles.tabActive]}
          onPress={() => setTab("professors")}
        >
          <Text
            style={[
              styles.tabText,
              tab === "professors" && styles.tabTextActive,
            ]}
          >
            Akademisyenler
          </Text>
        </Pressable>
      </View>

      {(tab === "projects" ? projQ.error : profQ.error) ? (
        <ErrorBox
          message={
            ((tab === "projects" ? projQ.error : profQ.error) as Error).message
          }
        />
      ) : null}

      {isLoading ? (
        <Loading />
      ) : (items?.length ?? 0) === 0 ? (
        <EmptyState
          title="Sonuç yok"
          description="Profilinize tag ekleyerek öneri almaya başlayın"
        />
      ) : tab === "projects" ? (
        items.map((p: any) => <ProjectCard key={p.id} {...p} />)
      ) : (
        items.map((p: any) => <ProfileCard key={p.id} {...p} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: fonts.size.xxl, fontWeight: "800", color: colors.text },
  subtitle: {
    marginTop: 4,
    fontSize: fonts.size.sm,
    color: colors.textMuted,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, alignItems: "center" },
  tabActive: { backgroundColor: colors.primarySoft },
  tabText: { fontSize: fonts.size.sm, fontWeight: "600", color: colors.textMuted },
  tabTextActive: { color: colors.primary },
});
