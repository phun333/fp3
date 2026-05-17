import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, fonts, radius } from "../lib/theme";

interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({
  label,
  hint,
  error,
  containerStyle,
  multiline,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[{ width: "100%" }, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textSubtle}
        {...rest}
        multiline={multiline}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && { borderColor: colors.primary },
          error && { borderColor: colors.danger },
          rest.style as any,
        ]}
      />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: fonts.size.sm,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: fonts.size.md,
    color: colors.text,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  hint: { fontSize: fonts.size.xs, color: colors.textMuted, marginTop: 4 },
  error: { fontSize: fonts.size.xs, color: colors.danger, marginTop: 4 },
});
