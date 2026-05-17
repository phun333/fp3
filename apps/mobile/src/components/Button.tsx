import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, fonts, radius } from "../lib/theme";

type Variant = "primary" | "outline" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "style" | "children"> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  icon,
  fullWidth,
  style,
  ...rest
}: ButtonProps) {
  const v = VARIANT[variant];
  const s = SIZE[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        v.container,
        { paddingVertical: s.padY, paddingHorizontal: s.padX },
        fullWidth && { alignSelf: "stretch" },
        pressed && !isDisabled && { opacity: 0.85 },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={{ marginRight: 6 }}>{icon}</View> : null}
          <Text style={[styles.text, { color: v.text, fontSize: s.font }]}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const VARIANT: Record<Variant, { container: ViewStyle; text: string }> = {
  primary: {
    container: { backgroundColor: colors.primary },
    text: "#ffffff",
  },
  outline: {
    container: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    text: colors.text,
  },
  ghost: {
    container: { backgroundColor: "transparent" },
    text: colors.primary,
  },
  danger: {
    container: { backgroundColor: colors.danger },
    text: "#ffffff",
  },
  success: {
    container: { backgroundColor: colors.success },
    text: "#ffffff",
  },
};

const SIZE: Record<Size, { padX: number; padY: number; font: number }> = {
  sm: { padX: 12, padY: 8, font: fonts.size.sm },
  md: { padX: 16, padY: 12, font: fonts.size.md },
  lg: { padX: 20, padY: 14, font: fonts.size.lg },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center" },
  text: { fontWeight: "600" },
});
