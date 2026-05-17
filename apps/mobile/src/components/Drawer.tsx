import { useRouter } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../lib/auth-context";
import { colors, fonts, radius } from "../lib/theme";
import { initialsFromName } from "../lib/utils";

interface DrawerContextValue {
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

export function useDrawer() {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error("useDrawer DrawerProvider içinde kullanılmalı");
  return ctx;
}

interface DrawerLink {
  label: string;
  href: string;
}

const studentLinks: DrawerLink[] = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Eşleştirme", href: "/matching" },
  { label: "Keşfet", href: "/discover" },
  { label: "Akademisyenler", href: "/professors" },
  { label: "Projeler", href: "/projects" },
  { label: "Projelerim", href: "/my-projects" },
  { label: "Yayınlar", href: "/publications" },
  { label: "Başvurularım", href: "/my-applications" },
  { label: "Hoca Başvurularım", href: "/my-professor-applications" },
  { label: "Davetlerim", href: "/invitations" },
  { label: "Kaydedilenler", href: "/saved-matches" },
  { label: "Profilim", href: "/profile" },
];

const professorLinks: DrawerLink[] = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Ekip Kur", href: "/matching" },
  { label: "Keşfet", href: "/discover" },
  { label: "Projeler", href: "/projects" },
  { label: "Projelerim", href: "/my-projects" },
  { label: "Gelen Başvurular", href: "/incoming-applications" },
  { label: "Öğrenci Talepleri", href: "/professor-applications" },
  { label: "Davetlerim", href: "/invitations" },
  { label: "Yayınlar", href: "/publications" },
  { label: "Akademisyenler", href: "/professors" },
  { label: "Profilim", href: "/profile" },
];

const WIDTH = Math.min(320, Dimensions.get("window").width * 0.85);

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);
  const translate = useRef(new Animated.Value(-WIDTH)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { user, signOut } = useAuth();

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);
  const toggle = useCallback(
    () => setVisible((v) => !v),
    []
  );

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(translate, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(translate, {
          toValue: -WIDTH,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => setRendered(false));
    }
  }, [visible, rendered, translate, fade]);

  const isProf = user?.role === "PROFESSOR";
  const links = isProf ? professorLinks : studentLinks;

  const go = (href: string) => {
    close();
    setTimeout(() => router.push(href as any), 120);
  };

  const onSignOut = async () => {
    close();
    await signOut();
    router.replace("/login");
  };

  return (
    <DrawerContext.Provider value={{ open, close, toggle }}>
      {children}
      <Modal
        visible={rendered}
        transparent
        animationType="none"
        onRequestClose={close}
        statusBarTranslucent
      >
        <Animated.View style={[styles.backdrop, { opacity: fade }]}>
          <Pressable style={{ flex: 1 }} onPress={close} />
        </Animated.View>
        <Animated.View
          style={[
            styles.drawer,
            { width: WIDTH, transform: [{ translateX: translate }] },
          ]}
        >
          <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom", "left"]}>
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {initialsFromName(user?.name)}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {user?.name || "FP3"}
                </Text>
                <Text style={styles.role} numberOfLines={1}>
                  {isProf ? "Akademisyen" : "Öğrenci"}
                </Text>
                {user?.department ? (
                  <Text style={styles.dept} numberOfLines={1}>
                    {user.department}
                  </Text>
                ) : null}
              </View>
            </View>

            <ScrollView style={{ flex: 1 }}>
              <View style={{ padding: 8 }}>
                {links.map((l) => (
                  <Pressable
                    key={l.href}
                    onPress={() => go(l.href)}
                    style={({ pressed }) => [
                      styles.linkRow,
                      pressed && { backgroundColor: colors.primarySoft },
                    ]}
                  >
                    <Text style={styles.linkText}>{l.label}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable onPress={onSignOut} style={styles.signOutBtn}>
                <Text style={styles.signOutText}>Çıkış Yap</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      </Modal>
    </DrawerContext.Provider>
  );
}

export function DrawerButton() {
  const { open } = useDrawer();
  return (
    <Pressable
      onPress={open}
      hitSlop={12}
      style={({ pressed }) => [
        { paddingHorizontal: 12, paddingVertical: 6 },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Text style={{ fontSize: 24, color: colors.text }}>☰</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.background,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  name: { fontSize: fonts.size.md, fontWeight: "700", color: colors.text },
  role: { fontSize: fonts.size.xs, color: colors.textMuted, marginTop: 2 },
  dept: { fontSize: fonts.size.xs, color: colors.textSubtle, marginTop: 2 },
  linkRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
  },
  linkText: {
    fontSize: fonts.size.md,
    fontWeight: "600",
    color: colors.text,
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  signOutBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  signOutText: {
    fontSize: fonts.size.md,
    fontWeight: "700",
    color: colors.danger,
  },
});
