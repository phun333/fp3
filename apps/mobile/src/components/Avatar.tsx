import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../lib/theme";
import { initialsFromName } from "../lib/utils";

export function Avatar({
  name,
  size = 44,
}: {
  name?: string | null;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>
        {initialsFromName(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "700",
    color: colors.primary,
  },
});
