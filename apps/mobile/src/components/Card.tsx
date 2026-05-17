import { Pressable, StyleSheet, View, type ViewProps } from "react-native";
import { colors, radius } from "../lib/theme";

interface CardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
}

export function Card({ children, onPress, style, padded = true, ...rest }: CardProps) {
  const content = (
    <View
      style={[styles.card, padded && styles.padded, style as any]}
      {...rest}
    >
      {children}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  padded: {
    padding: 16,
  },
});
