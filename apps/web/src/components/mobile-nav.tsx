"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  List,
  House,
  Compass,
  Users,
  Briefcase,
  BookOpen,
  UserCircle,
  SignOut,
  GraduationCap,
  BookmarkSimple,
} from "@phosphor-icons/react";
import { useState } from "react";

const studentLinks = [
  { href: "/dashboard", label: "Ana Sayfa", icon: House },
  { href: "/matching", label: "Eşleştirme", icon: Compass },
  { href: "/discover", label: "Keşfet", icon: House },
  { href: "/professors", label: "Akademisyenler", icon: Users },
  { href: "/projects", label: "Projeler", icon: Briefcase },
  { href: "/publications", label: "Yayınlar", icon: BookOpen },
  { href: "/saved-matches", label: "Kaydedilenler", icon: BookmarkSimple },
  { href: "/profile", label: "Profilim", icon: UserCircle },
];

const professorLinks = [
  { href: "/dashboard", label: "Ana Sayfa", icon: House },
  { href: "/matching", label: "Ekip Kur", icon: Compass },
  { href: "/discover", label: "Keşfet", icon: Compass },
  { href: "/professors", label: "Akademisyenler", icon: Users },
  { href: "/projects", label: "Projeler", icon: Briefcase },
  { href: "/publications", label: "Yayınlar", icon: BookOpen },
  { href: "/profile", label: "Profilim", icon: UserCircle },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="md:hidden flex h-14 items-center justify-between border-b px-4 bg-background sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <GraduationCap size={24} weight="duotone" className="text-primary" />
        <span className="font-bold">FP3</span>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <List size={24} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-14 items-center gap-2 border-b px-6">
            <GraduationCap size={24} weight="duotone" className="text-primary" />
            <span className="font-bold">FP3</span>
          </div>
          <nav className="p-4 space-y-1">
            {(user?.role === "PROFESSOR" ? professorLinks : studentLinks).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                <link.icon size={20} />
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="border-t p-4 mt-auto">
            <p className="text-sm font-medium px-3 truncate">{user?.name}</p>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground mt-2"
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
            >
              <SignOut size={20} />
              Çıkış Yap
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
