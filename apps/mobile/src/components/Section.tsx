import { StyleSheet, Text, View, type ViewProps } from "react-native";
import { colors, fonts } from "../lib/theme";

interface SectionProps extends ViewProps {
  title: string;
  description?: string;
  right?: React.ReactNode;
}

export function Section({
  title,
  description,
  right,
  children,
  style,
  ...rest
}: SectionProps) {
  return (
    <View style={[{ marginBottom: 20 }, style as any]} {...rest}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {description ? (
            <Text style={styles.desc}>{description}</Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  title: {
    fontSize: fonts.size.lg,
    fontWeight: "700",
    color: colors.text,
  },
  desc: {
    marginTop: 2,
    fontSize: fonts.size.sm,
    color: colors.textMuted,
  },
});
