import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Badge } from "../../src/components/Badge";
import { Card } from "../../src/components/Card";
import { Loading } from "../../src/components/Loading";
import { ProfileCard } from "../../src/components/ProfileCard";
import { Section } from "../../src/components/Section";
import { applicationsApi, discoverApi, profileApi } from "../../src/lib/api";
import { useAuth } from "../../src/lib/auth-context";
import { colors, fonts } from "../../src/lib/theme";

interface QuickLink {
  label: string;
  description: string;
  href: string;
}

const studentQuick: QuickLink[] = [
  { label: "Akademisyen Eşleştir", description: "Tag bazlı eşleştirme", href: "/matching" },
  { label: "Projelerimi Bul", description: "Açık projelere bak", href: "/projects" },
  { label: "Başvurularım", description: "Başvuru durumunu takip et", href: "/my-applications" },
  { label: "Kaydedilenler", description: "Kayıtlı eşleşmeler", href: "/saved-matches" },
  { label: "Profilim", description: "Profili düzenle", href: "/profile" },
];

const profQuick: QuickLink[] = [
  { label: "Proje Oluştur", description: "Öğrenci arayan ilan aç", href: "/projects/new" },
  { label: "Projelerim", description: "Açık projelerini yönet", href: "/my-projects" },
  { label: "Gelen Başvurular", description: "Adayları incele", href: "/incoming-applications" },
  { label: "Yayın Ekle", description: "Yeni yayın", href: "/publications/new" },
  { label: "Profilim", description: "Profili düzenle", href: "/profile" },
];

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const isProf = user?.role === "PROFESSOR";

  const profileQuery = useQuery<any>({
    queryKey: ["profile"],
    queryFn: () => profileApi.getMe(),
  });

  const appsQuery = useQuery<any>({
    queryKey: ["my-applications", "summary"],
    queryFn: () => applicationsApi.myApplications("limit=20"),
    enabled: !isProf,
  });

  const recStudents = useQuery<any>({
    queryKey: ["discover-students", "summary"],
    queryFn: () => discoverApi.students("limit=4"),
    enabled: isProf,
  });

  const refreshing =
    profileQuery.isFetching || appsQuery.isFetching || recStudents.isFetching;

  const onRefresh = () => {
    profileQuery.refetch();
    if (isProf) recStudents.refetch();
    else appsQuery.refetch();
  };

  if (profileQuery.isLoading) return <Loading />;

  const p = profileQuery.data?.data;
  const counts = p?._count || {};
  const apps: any[] = appsQuery.data?.data || [];
  const pending = apps.filter((a) => a.status === "PENDING").length;
  const accepted = apps.filter((a) => a.status === "ACCEPTED").length;

  const quickLinks = isProf ? profQuick : studentQuick;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={{ marginBottom: 20 }}>
        <Text style={styles.greet}>
          Hoş geldin, {user?.name?.split(" ")[0]} 👋
        </Text>
        <Text style={styles.greetDesc}>
          {isProf
            ? "Projelerini yönet ve uygun öğrencileri keşfet"
            : "Profilini tamamla, hocalarla eşleş ve projeleri keşfet"}
        </Text>
      </View>

      {/* Stat Cards */}
      <View style={styles.statsRow}>
        {isProf ? (
          <>
            <StatCard label="Projelerim" value={counts.projects || 0} />
            <StatCard label="Yayınlarım" value={counts.publications || 0} />
            <StatCard label="Gelen Başvuru" value={counts.applications || 0} />
          </>
        ) : (
          <>
            <StatCard label="Başvurularım" value={counts.applications || 0} />
            <StatCard label="Beklemede" value={pending} />
            <StatCard label="Kabul Edilen" value={accepted} />
          </>
        )}
      </View>

      {/* Profile completion */}
      <Card style={{ marginBottom: 20 }}>
        <View style={styles.completion}>
          <View style={{ flex: 1 }}>
            <Text style={styles.completionTitle}>
              {p?.bio && (isProf || p?.year) && (p?.tags?.length || 0) > 0
                ? "Profilin tamamlandı 🎉"
                : "Profilini tamamla"}
            </Text>
            <Text style={styles.completionDesc}>
              {!p?.bio
                ? "Biyografi ekle"
                : !isProf && !p?.year
                ? "Sınıf bilgini gir"
                : (p?.tags?.length || 0) === 0
                ? "İlgi alanlarını seç"
                : "Eşleştirmeye hazırsın!"}
            </Text>
          </View>
          <Badge label={isProf ? "Akademisyen" : "Öğrenci"} tone="default" />
        </View>
      </Card>

      {/* Quick links */}
      <Section title="Hızlı Erişim">
        <View style={{ gap: 10 }}>
          {quickLinks.map((q) => (
            <Card
              key={q.href}
              padded={false}
              onPress={() => router.push(q.href as any)}
              style={{ padding: 14 }}
            >
              <Text style={styles.qLabel}>{q.label}</Text>
              <Text style={styles.qDesc}>{q.description}</Text>
            </Card>
          ))}
        </View>
      </Section>

      {/* Recommended students for professor */}
      {isProf && (recStudents.data?.data?.length ?? 0) > 0 ? (
        <Section title="Sana Uygun Öğrenciler">
          {(recStudents.data?.data || []).slice(0, 4).map((s: any) => (
            <ProfileCard key={s.id} {...s} />
          ))}
        </Section>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  greet: { fontSize: fonts.size.xxl, fontWeight: "800", color: colors.text },
  greetDesc: {
    marginTop: 6,
    fontSize: fonts.size.sm,
    color: colors.textMuted,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 14,
  },
  statValue: {
    fontSize: fonts.size.xxl,
    fontWeight: "800",
    color: colors.text,
  },
  statLabel: {
    marginTop: 4,
    fontSize: fonts.size.xs,
    color: colors.textMuted,
    textAlign: "center",
  },
  completion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  completionTitle: {
    fontSize: fonts.size.md,
    fontWeight: "700",
    color: colors.text,
  },
  completionDesc: {
    marginTop: 2,
    fontSize: fonts.size.sm,
    color: colors.textMuted,
  },
  qLabel: { fontSize: fonts.size.md, fontWeight: "700", color: colors.text },
  qDesc: { marginTop: 2, fontSize: fonts.size.sm, color: colors.textMuted },
});
