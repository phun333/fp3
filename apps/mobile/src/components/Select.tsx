import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, fonts, radius } from "../lib/theme";

interface SelectProps {
  label?: string;
  value?: string | null;
  placeholder?: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export function Select({
  label,
  value,
  placeholder = "Seçiniz",
  options,
  onChange,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <View style={{ width: "100%" }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        <Text
          style={[
            styles.value,
            !current && { color: colors.textSubtle },
          ]}
          numberOfLines={1}
        >
          {current?.label || placeholder}
        </Text>
        <Text style={styles.chev}>▾</Text>
      </Pressable>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>{label || "Seçiniz"}</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {options.map((o) => (
                <Pressable
                  key={o.value}
                  style={({ pressed }) => [
                    styles.option,
                    o.value === value && styles.optionActive,
                    pressed && { backgroundColor: colors.surface },
                  ]}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      o.value === value && { color: colors.primary, fontWeight: "700" },
                    ]}
                  >
                    {o.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  value: { flex: 1, fontSize: fonts.size.md, color: colors.text },
  chev: { color: colors.textMuted },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    width: "100%",
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: 16,
  },
  sheetTitle: {
    fontSize: fonts.size.md,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  optionActive: { backgroundColor: colors.primarySoft },
  optionText: { fontSize: fonts.size.md, color: colors.text },
});
