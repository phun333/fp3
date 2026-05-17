import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { tagsApi } from "../lib/api";
import { colors, fonts, radius } from "../lib/theme";

interface TagSelectorProps {
  selected: string[];
  onChange: (ids: string[]) => void;
  max?: number;
}

export function TagSelector({ selected, onChange, max = 10 }: TagSelectorProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: () => tagsApi.list() as any,
  });

  if (isLoading) {
    return (
      <View style={{ paddingVertical: 24, alignItems: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const grouped: Record<string, any[]> = data?.data?.grouped || {};

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else if (selected.length < max) {
      onChange([...selected, id]);
    }
  };

  return (
    <View>
      <Text style={styles.counter}>
        {selected.length}/{max} seçildi
      </Text>
      <ScrollView style={{ maxHeight: 320 }} nestedScrollEnabled>
        {Object.entries(grouped).map(([category, tags]) => (
          <View key={category} style={{ marginBottom: 12 }}>
            <Text style={styles.cat}>{category}</Text>
            <View style={styles.wrap}>
              {(tags as any[]).map((tag: any) => {
                const active = selected.includes(tag.id);
                return (
                  <Pressable
                    key={tag.id}
                    onPress={() => toggle(tag.id)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {tag.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  counter: {
    fontSize: fonts.size.xs,
    color: colors.textMuted,
    marginBottom: 8,
  },
  cat: {
    fontSize: fonts.size.sm,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 6,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginRight: 6,
    marginBottom: 6,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fonts.size.xs,
    fontWeight: "600",
    color: colors.text,
  },
  chipTextActive: { color: "#fff" },
});
