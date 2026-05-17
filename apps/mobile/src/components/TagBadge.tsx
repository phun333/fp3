import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius } from "../lib/theme";

const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  "Yapay Zeka": { bg: "#ede9fe", fg: "#6d28d9" },
  "Yazılım": { bg: "#e0f2fe", fg: "#0369a1" },
  "Donanım": { bg: "#fef3c7", fg: "#b45309" },
  "Veri Bilimi": { bg: "#dcfce7", fg: "#15803d" },
  "Mobil": { bg: "#fce7f3", fg: "#be185d" },
  "Web": { bg: "#dbeafe", fg: "#1d4ed8" },
};

export function TagBadge({
  name,
  category,
}: {
  name: string;
  category?: string | null;
}) {
  const palette = (category && CATEGORY_COLORS[category]) || {
    bg: colors.primarySoft,
    fg: colors.primary,
  };
  return (
    <View style={[styles.base, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.fg }]} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginRight: 6,
    marginBottom: 6,
  },
  text: {
    fontSize: fonts.size.xs,
    fontWeight: "500",
  },
});
