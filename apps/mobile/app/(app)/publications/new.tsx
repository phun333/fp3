import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "../../../src/components/Button";
import { Card } from "../../../src/components/Card";
import { Input } from "../../../src/components/Input";
import { ErrorBox } from "../../../src/components/Loading";
import { TagSelector } from "../../../src/components/TagSelector";
import { publicationsApi } from "../../../src/lib/api";
import { colors, fonts } from "../../../src/lib/theme";

export default function NewPublicationScreen() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({
    title: "",
    abstract: "",
    url: "",
    year: String(currentYear),
  });
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  const create = useMutation({
    mutationFn: () =>
      publicationsApi.create({
        title: form.title,
        abstract: form.abstract || undefined,
        url: form.url || undefined,
        year: Number(form.year) || currentYear,
        tagIds,
      }),
    onSuccess: () => router.replace("/publications"),
    onError: (e: any) => setError(e.message || "Hata oluştu"),
  });

  const onSubmit = () => {
    setError("");
    if (form.title.length < 5) return setError("Başlık en az 5 karakter");
    if (tagIds.length === 0) return setError("En az 1 tag seç");
    create.mutate();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.surface }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Card>
          <Text style={styles.title}>Yeni Yayın Ekle</Text>
          {error ? (
            <View style={{ marginTop: 12 }}>
              <ErrorBox message={error} />
            </View>
          ) : null}
          <View style={{ gap: 14, marginTop: 12 }}>
            <Input
              label="Yayın Başlığı"
              value={form.title}
              onChangeText={(v) => setForm({ ...form, title: v })}
            />
            <Input
              label="Özet (Abstract)"
              multiline
              value={form.abstract}
              onChangeText={(v) => setForm({ ...form, abstract: v })}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Input
                label="Yıl"
                keyboardType="number-pad"
                value={form.year}
                onChangeText={(v) =>
                  setForm({ ...form, year: v.replace(/[^0-9]/g, "") })
                }
                containerStyle={{ flex: 1 }}
              />
              <Input
                label="URL (opsiyonel)"
                placeholder="https://..."
                autoCapitalize="none"
                value={form.url}
                onChangeText={(v) => setForm({ ...form, url: v })}
                containerStyle={{ flex: 2 }}
              />
            </View>
            <View>
              <Text style={styles.label}>İlgili Tag'ler</Text>
              <View style={{ marginTop: 6 }}>
                <TagSelector selected={tagIds} onChange={setTagIds} max={10} />
              </View>
            </View>
            <Button
              title={create.isPending ? "Ekleniyor..." : "Yayın Ekle"}
              loading={create.isPending}
              onPress={onSubmit}
              fullWidth
            />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fonts.size.xl, fontWeight: "800", color: colors.text },
  label: { fontSize: fonts.size.sm, fontWeight: "600", color: colors.text },
});
