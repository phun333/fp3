import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../src/components/Button";
import { ErrorBox } from "../../src/components/Loading";
import { Input } from "../../src/components/Input";
import { Select } from "../../src/components/Select";
import { useAuth } from "../../src/lib/auth-context";
import { colors, fonts } from "../../src/lib/theme";

const departments = [
  "Bilgisayar Mühendisliği",
  "Yazılım Mühendisliği",
  "Elektrik-Elektronik Mühendisliği",
  "Makine Mühendisliği",
  "Endüstri Mühendisliği",
  "Mekatronik Mühendisliği",
];

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    department: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const onSubmit = async () => {
    setError("");
    if (!form.role) return setError("Lütfen rol seçiniz");
    if (!form.department) return setError("Lütfen bölüm seçiniz");
    setLoading(true);
    try {
      await signUp({
        ...form,
        email: form.email.trim(),
      });
    } catch (e: any) {
      setError(e.message || "Kayıt başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Text style={styles.title}>Hesap Oluştur</Text>
            <Text style={styles.caption}>
              Sadece @ostimteknik.edu.tr e-posta adresleri kabul edilir
            </Text>
          </View>

          {error ? <ErrorBox message={error} /> : null}

          <View style={{ gap: 14 }}>
            <Input
              label="Ad Soyad"
              placeholder="Adınız Soyadınız"
              value={form.name}
              onChangeText={(v) => update("name", v)}
            />
            <Input
              label="E-posta"
              placeholder="ornek@ostimteknik.edu.tr"
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(v) => update("email", v)}
            />
            <Select
              label="Rol"
              value={form.role}
              onChange={(v) => update("role", v)}
              options={[
                { value: "STUDENT", label: "Öğrenci" },
                { value: "PROFESSOR", label: "Akademisyen" },
              ]}
            />
            <Select
              label="Bölüm"
              value={form.department}
              onChange={(v) => update("department", v)}
              options={departments.map((d) => ({ value: d, label: d }))}
            />
            <Input
              label="Şifre"
              placeholder="En az 8 karakter"
              secureTextEntry
              value={form.password}
              onChangeText={(v) => update("password", v)}
              hint="En az 8 karakter, 1 büyük harf ve 1 rakam"
            />
            <Button
              title={loading ? "Oluşturuluyor..." : "Hesap Oluştur"}
              onPress={onSubmit}
              loading={loading}
              fullWidth
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Zaten hesabınız var mı? </Text>
            <Pressable onPress={() => router.push("/login")}>
              <Text style={styles.link}>Giriş Yap</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 60 },
  hero: { alignItems: "center", marginTop: 12, marginBottom: 24 },
  title: { fontSize: fonts.size.xxl, fontWeight: "800", color: colors.text },
  caption: {
    marginTop: 6,
    fontSize: fonts.size.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
  footer: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: { color: colors.textMuted, fontSize: fonts.size.sm },
  link: { color: colors.primary, fontWeight: "600", fontSize: fonts.size.sm },
});
