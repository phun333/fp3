import { Redirect, Stack } from "expo-router";
import { DrawerButton, DrawerProvider } from "../../src/components/Drawer";
import { Loading } from "../../src/components/Loading";
import { useAuth } from "../../src/lib/auth-context";
import { colors } from "../../src/lib/theme";

export default function AppLayout() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Redirect href="/login" />;

  return (
    <DrawerProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
          headerLeft: () => <DrawerButton />,
        }}
      >
        <Stack.Screen name="index" options={{ title: "FP3" }} />
        <Stack.Screen name="discover" options={{ title: "Keşfet" }} />
        <Stack.Screen name="profile" options={{ title: "Profilim" }} />
        <Stack.Screen name="matching" options={{ title: "Eşleştirme" }} />
        <Stack.Screen
          name="my-applications"
          options={{ title: "Başvurularım" }}
        />
        <Stack.Screen
          name="incoming-applications"
          options={{ title: "Gelen Başvurular" }}
        />
        <Stack.Screen name="my-projects" options={{ title: "Projelerim" }} />
        <Stack.Screen name="invitations" options={{ title: "Davetlerim" }} />
        <Stack.Screen
          name="professor-applications"
          options={{ title: "Öğrenci Talepleri" }}
        />
        <Stack.Screen
          name="my-professor-applications"
          options={{ title: "Hoca Başvurularım" }}
        />
        <Stack.Screen name="saved-matches" options={{ title: "Kaydedilenler" }} />
        <Stack.Screen
          name="professors/index"
          options={{ title: "Akademisyenler" }}
        />
        <Stack.Screen
          name="professors/[id]"
          options={{ title: "Akademisyen" }}
        />
        <Stack.Screen name="projects/index" options={{ title: "Projeler" }} />
        <Stack.Screen name="projects/[id]" options={{ title: "Proje" }} />
        <Stack.Screen name="projects/new" options={{ title: "Yeni Proje" }} />
        <Stack.Screen
          name="publications/index"
          options={{ title: "Yayınlar" }}
        />
        <Stack.Screen
          name="publications/new"
          options={{ title: "Yayın Ekle" }}
        />
      </Stack>
    </DrawerProvider>
  );
}
