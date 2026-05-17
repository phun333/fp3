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
import { useAuth } from "../../src/lib/auth-context";
import { colors, fonts } from "../../src/lib/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      setError(e.message || "Giriş başarısız");
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
            <Text style={styles.logo}>FP3</Text>
            <Text style={styles.subtitle}>Finding Publication Project Partner</Text>
            <Text style={styles.caption}>
              Ostim Teknik Üniversitesi hesabınızla giriş yapın
            </Text>
          </View>

          {error ? <ErrorBox message={error} /> : null}

          <View style={{ gap: 14 }}>
            <Input
              label="E-posta"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="ornek@ostimteknik.edu.tr"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              label="Şifre"
              secureTextEntry
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
            />
            <Button
              title={loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              onPress={onSubmit}
              loading={loading}
              fullWidth
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Hesabınız yok mu? </Text>
            <Pressable onPress={() => router.push("/signup")}>
              <Text style={styles.link}>Kayıt Ol</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
    justifyContent: "center",
  },
  hero: { alignItems: "center", marginBottom: 28 },
  logo: {
    fontSize: 44,
    fontWeight: "800",
    color: colors.primary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: fonts.size.md,
    color: colors.text,
    fontWeight: "600",
  },
  caption: {
    marginTop: 8,
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
