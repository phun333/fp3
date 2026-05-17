import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius } from "../lib/theme";

type Tone = "default" | "secondary" | "success" | "danger" | "warning" | "outline";

export function Badge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: Tone;
}) {
  const s = TONE[tone];
  return (
    <View style={[styles.base, s.container]}>
      <Text style={[styles.text, { color: s.color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const TONE: Record<Tone, { container: any; color: string }> = {
  default: {
    container: { backgroundColor: colors.primarySoft },
    color: colors.primary,
  },
  secondary: {
    container: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    color: colors.textMuted,
  },
  success: {
    container: { backgroundColor: colors.successSoft },
    color: "#047857",
  },
  danger: {
    container: { backgroundColor: colors.dangerSoft },
    color: "#b91c1c",
  },
  warning: {
    container: { backgroundColor: colors.warningSoft },
    color: "#b45309",
  },
  outline: {
    container: { borderWidth: 1, borderColor: colors.border, backgroundColor: "transparent" },
    color: colors.textMuted,
  },
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: fonts.size.xs,
    fontWeight: "600",
  },
});
