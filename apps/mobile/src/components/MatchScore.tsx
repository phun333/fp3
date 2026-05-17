import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius } from "../lib/theme";

export function MatchScore({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const color =
    pct >= 75 ? colors.success : pct >= 50 ? colors.primary : colors.warning;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>Eşleşme</Text>
        <Text style={[styles.value, { color }]}>%{pct}</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${pct}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { fontSize: fonts.size.xs, color: colors.textMuted },
  value: { fontSize: fonts.size.xs, fontWeight: "700" },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  fill: { height: "100%" },
});
