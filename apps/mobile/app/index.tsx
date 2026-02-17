import { View, Text, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FP3 Mobile</Text>
      <Text style={styles.subtitle}>Finding Publication Project Partner</Text>
      <Text style={styles.description}>
        Akademik ortaklık platformu — Ostim Teknik Üniversitesi
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#6366f1",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#64748b",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
  },
});
