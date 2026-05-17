import { Redirect, Stack } from "expo-router";
import { Loading } from "../../src/components/Loading";
import { useAuth } from "../../src/lib/auth-context";

export default function AuthLayout() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (user) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
