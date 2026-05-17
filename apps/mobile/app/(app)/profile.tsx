import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Pressable,
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
import { ErrorBox, Loading } from "../../src/components/Loading";
import { Section } from "../../src/components/Section";
import { TagBadge } from "../../src/components/TagBadge";
import { TagSelector } from "../../src/components/TagSelector";
import { debugAuthState, profileApi } from "../../src/lib/api";
import { useAuth } from "../../src/lib/auth-context";
import { colors, fonts, radius } from "../../src/lib/theme";

export default function ProfileScreen() {
  const { user, refreshSession } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, error: fetchError, refetch } = useQuery<any>({
    queryKey: ["profile"],
    queryFn: () => profileApi.getMe(),
  });

  const [debug, setDebug] = useState<{
    hasToken: boolean;
    tokenPreview: string | null;
    apiUrl: string;
  } | null>(null);
  useEffect(() => {
    debugAuthState().then(setDebug);
  }, [data, fetchError]);

  const p = data?.data;
  const isStudent = user?.role === "STUDENT";

  const [editing, setEditing] = useState(false);
  const [editTags, setEditTags] = useState(false);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    department: "",
    year: null as number | null,
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (p) {
      setForm({
        name: p.name || "",
        bio: p.bio || "",
        department: p.department || "",
        year: p.year ?? null,
      });
      setSelectedTags(p.tags?.map((t: any) => t.id) || []);
    }
  }, [p]);

  const updateProfile = useMutation({
    mutationFn: (body: any) => profileApi.update(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      refreshSession();
      setEditing(false);
    },
    onError: (e: any) => setError(e.message || "Hata oluştu"),
  });

  const updateTags = useMutation({
    mutationFn: (ids: string[]) => profileApi.updateTags(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      setEditTags(false);
    },
    onError: (e: any) => setError(e.message || "Hata oluştu"),
  });

  if (isLoading) return <Loading />;

  // Fetch hatası varsa hata ekranı göster (sonsuz loading'i kır)
  if (!p) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.surface }}
        contentContainerStyle={{ padding: 16 }}
      >
        <Card>
          <Text style={{ fontWeight: "700", fontSize: fonts.size.lg, color: colors.text }}>
            Profil yüklenemedi
          </Text>
          <Text style={{ marginTop: 6, color: colors.textMuted, fontSize: fonts.size.sm }}>
            {(fetchError as Error)?.message ||
              "API'ye bağlanılamadı. Oturum bilgilerini kontrol et."}
          </Text>
          {debug ? (
            <View style={styles.debug}>
              <Text style={styles.debugLabel}>API URL</Text>
              <Text style={styles.debugValue}>{debug.apiUrl}</Text>
              <Text style={styles.debugLabel}>Bearer Token</Text>
              <Text style={styles.debugValue}>
                {debug.hasToken
                  ? `var: ${debug.tokenPreview}`
                  : "YOK (giriş yapılmamış veya token kaydedilmemiş)"}
              </Text>
            </View>
          ) : null}
          <View style={{ marginTop: 14, gap: 8 }}>
            <Button title="Tekrar Dene" onPress={() => refetch()} />
            <Button
              title="Çıkış Yap"
              variant="outline"
              onPress={async () => {
                await refreshSession();
              }}
            />
          </View>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      {debug ? (
        <Card style={{ marginBottom: 12 }}>
          <Text style={styles.debugLabel}>Bearer Token</Text>
          <Text style={styles.debugValue}>
            {debug.hasToken ? debug.tokenPreview : "YOK"}
          </Text>
        </Card>
      ) : null}
      {error ? <ErrorBox message={error} /> : null}

      <Card style={{ marginBottom: 16 }}>
        {!editing ? (
          <View>
            <View style={styles.row}>
              <Avatar name={p.name} size={64} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.muted}>{p.department}</Text>
                <Text style={styles.muted}>{p.email}</Text>
                <Text style={styles.muted}>
                  {p.role === "PROFESSOR" ? "Akademisyen" : "Öğrenci"}
                  {p.year ? ` • ${p.year}. sınıf` : ""}
                </Text>
              </View>
            </View>
            {p.bio ? (
              <Text style={styles.bio}>{p.bio}</Text>
            ) : (
              <Text style={styles.bioEmpty}>
                Biyografi eklenmemiş — düzenleyerek ekleyebilirsin
              </Text>
            )}
            <View style={{ marginTop: 12 }}>
              <Button
                title="Profili Düzenle"
                variant="outline"
                size="sm"
                onPress={() => {
                  setError("");
                  setEditing(true);
                }}
              />
            </View>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <Input
              label="Ad Soyad"
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
            />
            <Input
              label="Bölüm"
              value={form.department}
              onChangeText={(v) => setForm({ ...form, department: v })}
            />
            {isStudent ? (
              <View>
                <Text style={styles.label}>Sınıf</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                  {[1, 2, 3, 4].map((y) => (
                    <Pressable
                      key={y}
                      onPress={() => setForm({ ...form, year: y })}
                      style={[
                        styles.yearBtn,
                        form.year === y && styles.yearBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.yearText,
                          form.year === y && styles.yearTextActive,
                        ]}
                      >
                        {y}. Sınıf
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
            <Input
              label="Biyografi"
              value={form.bio}
              onChangeText={(v) => setForm({ ...form, bio: v })}
              multiline
              placeholder="Kendinizi kısaca tanıtın..."
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              <Button
                title={updateProfile.isPending ? "Kaydediliyor..." : "Kaydet"}
                loading={updateProfile.isPending}
                onPress={() =>
                  updateProfile.mutate({
                    name: form.name,
                    bio: form.bio || undefined,
                    department: form.department,
                    year: form.year || undefined,
                  })
                }
                style={{ flex: 1 }}
              />
              <Button
                title="İptal"
                variant="outline"
                onPress={() => setEditing(false)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}
      </Card>

      <Section
        title="İlgi Alanları"
        right={
          !editTags ? (
            <Button
              title="Düzenle"
              variant="ghost"
              size="sm"
              onPress={() => setEditTags(true)}
            />
          ) : undefined
        }
      >
        <Card>
          {editTags ? (
            <View>
              <TagSelector
                selected={selectedTags}
                onChange={setSelectedTags}
                max={10}
              />
              <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                <Button
                  title={updateTags.isPending ? "Kaydediliyor..." : "Kaydet"}
                  loading={updateTags.isPending}
                  disabled={selectedTags.length === 0}
                  onPress={() => updateTags.mutate(selectedTags)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="İptal"
                  variant="outline"
                  onPress={() => setEditTags(false)}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : p.tags?.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {p.tags.map((t: any) => (
                <TagBadge key={t.id} name={t.name} category={t.category} />
              ))}
            </View>
          ) : (
            <Text style={styles.bioEmpty}>
              Henüz tag eklenmedi. Düzenle butonu ile ekle.
            </Text>
          )}
        </Card>
      </Section>

      <Section title="İstatistikler">
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { label: "Yayın", value: p?._count?.publications || 0 },
            { label: "Proje", value: p?._count?.projects || 0 },
            { label: "Başvuru", value: p?._count?.applications || 0 },
          ].map((s) => (
            <Card key={s.label} style={{ flex: 1, alignItems: "center" }}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </Card>
          ))}
        </View>
      </Section>

      <View style={{ alignItems: "flex-start", marginTop: 8 }}>
        <Badge label="@ostimteknik.edu.tr" tone="secondary" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  debug: {
    marginTop: 12,
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: radius.md,
  },
  debugLabel: {
    fontSize: fonts.size.xs,
    color: colors.textMuted,
    marginTop: 4,
  },
  debugValue: {
    fontSize: fonts.size.sm,
    color: colors.text,
    fontWeight: "600",
    fontFamily: "Courier",
  },
  row: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: fonts.size.xl, fontWeight: "700", color: colors.text },
  muted: { fontSize: fonts.size.sm, color: colors.textMuted, marginTop: 2 },
  bio: {
    marginTop: 12,
    fontSize: fonts.size.sm,
    color: colors.text,
    lineHeight: 20,
  },
  bioEmpty: {
    marginTop: 12,
    fontStyle: "italic",
    color: "#b45309",
    fontSize: fonts.size.sm,
  },
  label: {
    fontSize: fonts.size.sm,
    fontWeight: "600",
    color: colors.text,
  },
  yearBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.background,
  },
  yearBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  yearText: { fontSize: fonts.size.sm, fontWeight: "600", color: colors.text },
  yearTextActive: { color: "#fff" },
  statValue: {
    fontSize: fonts.size.xxl,
    fontWeight: "800",
    color: colors.text,
  },
  statLabel: {
    fontSize: fonts.size.xs,
    color: colors.textMuted,
    marginTop: 4,
  },
});
