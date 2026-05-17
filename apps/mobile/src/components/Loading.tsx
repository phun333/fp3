import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../lib/theme";

export function Loading({ label = "Yükleniyor..." }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description ? <Text style={styles.emptyDesc}>{description}</Text> : null}
    </View>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  text: { marginTop: 8, color: colors.textMuted, fontSize: fonts.size.sm },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: fonts.size.lg,
    fontWeight: "700",
    color: colors.text,
  },
  emptyDesc: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: fonts.size.sm,
    textAlign: "center",
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: "#b91c1c", fontSize: fonts.size.sm },
});
