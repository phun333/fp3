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
import { projectsApi } from "../../../src/lib/api";
import { colors, fonts } from "../../../src/lib/theme";

export default function NewProjectScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    studentSlots: "2",
    professorSlots: "1",
  });
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  const create = useMutation({
    mutationFn: () =>
      projectsApi.create({
        title: form.title,
        description: form.description,
        studentSlots: Number(form.studentSlots) || 0,
        professorSlots: Number(form.professorSlots) || 1,
        tagIds,
      }),
    onSuccess: (data: any) => {
      router.replace(`/projects/${data.data.id}` as any);
    },
    onError: (e: any) => setError(e.message || "Hata oluştu"),
  });

  const onSubmit = () => {
    setError("");
    if (form.title.length < 5) return setError("Başlık en az 5 karakter olmalı");
    if (form.description.length < 20)
      return setError("Açıklama en az 20 karakter olmalı");
    if (tagIds.length === 0) return setError("En az 1 tag seçmelisin");
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
          <Text style={styles.title}>Yeni Proje Oluştur</Text>
          {error ? (
            <View style={{ marginTop: 12 }}>
              <ErrorBox message={error} />
            </View>
          ) : null}
          <View style={{ gap: 14, marginTop: 12 }}>
            <Input
              label="Proje Başlığı"
              placeholder="Ör: Türkçe NLP ile Duygu Analizi"
              value={form.title}
              onChangeText={(v) => setForm({ ...form, title: v })}
            />
            <Input
              label="Açıklama"
              multiline
              placeholder="Proje hakkında detaylı bilgi verin..."
              value={form.description}
              onChangeText={(v) => setForm({ ...form, description: v })}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Input
                label="Hoca Kontenjanı"
                keyboardType="number-pad"
                value={form.professorSlots}
                onChangeText={(v) =>
                  setForm({ ...form, professorSlots: v.replace(/[^0-9]/g, "") })
                }
                hint="Projeyi açan hoca dahil"
                containerStyle={{ flex: 1 }}
              />
              <Input
                label="Öğrenci Kontenjanı"
                keyboardType="number-pad"
                value={form.studentSlots}
                onChangeText={(v) =>
                  setForm({ ...form, studentSlots: v.replace(/[^0-9]/g, "") })
                }
                containerStyle={{ flex: 1 }}
              />
            </View>
            <View>
              <Text style={styles.label}>İlgili Tag'ler</Text>
              <View style={{ marginTop: 6 }}>
                <TagSelector selected={tagIds} onChange={setTagIds} max={10} />
              </View>
            </View>
            <Button
              title={create.isPending ? "Oluşturuluyor..." : "Proje Oluştur"}
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
  label: {
    fontSize: fonts.size.sm,
    fontWeight: "600",
    color: colors.text,
  },
});
