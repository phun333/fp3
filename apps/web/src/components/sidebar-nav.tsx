"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  House,
  Compass,
  Users,
  Briefcase,
  BookOpen,
  UserCircle,
  SignOut,
  GraduationCap,
  ClipboardText,
  FolderOpen,
  BookmarkSimple,
} from "@phosphor-icons/react";

const studentLinks = [
  { href: "/dashboard", label: "Ana Sayfa", icon: House },
  { href: "/matching", label: "Eşleştirme", icon: Compass },
  { href: "/discover", label: "Keşfet", icon: GraduationCap },
  { href: "/professors", label: "Akademisyenler", icon: Users },
  { href: "/projects", label: "Projeler", icon: Briefcase },
  { href: "/publications", label: "Yayınlar", icon: BookOpen },
  { href: "/my-applications", label: "Başvurularım", icon: ClipboardText },
  { href: "/saved-matches", label: "Kaydedilenler", icon: BookmarkSimple },
  { href: "/profile", label: "Profilim", icon: UserCircle },
];

const professorLinks = [
  { href: "/dashboard", label: "Ana Sayfa", icon: House },
  { href: "/matching", label: "Ekip Kur", icon: Compass },
  { href: "/discover", label: "Keşfet", icon: Compass },
  { href: "/projects", label: "Projeler", icon: Briefcase },
  { href: "/my-projects", label: "Projelerim", icon: FolderOpen },
  { href: "/publications", label: "Yayınlar", icon: BookOpen },
  { href: "/professors", label: "Akademisyenler", icon: Users },
  { href: "/profile", label: "Profilim", icon: UserCircle },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const links = user?.role === "PROFESSOR" ? professorLinks : studentLinks;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar h-screen sticky top-0 shadow-sm">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <GraduationCap size={28} weight="duotone" className="text-sidebar-primary" />
        <span className="text-lg font-bold text-sidebar-foreground">FP3</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === link.href
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <link.icon size={20} weight={pathname === link.href ? "fill" : "regular"} />
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-4">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium text-sidebar-foreground truncate">
            {user?.name}
          </p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={handleSignOut}
        >
          <SignOut size={20} />
          Çıkış Yap
        </Button>
      </div>
    </aside>
  );
}
