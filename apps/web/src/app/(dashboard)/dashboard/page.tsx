"use client";

import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { profileApi, discoverApi, applicationsApi } from "@/lib/api";
import { ProfileCard } from "@/components/profile-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TagBadge } from "@/components/tag-badge";
import {
  Briefcase,
  BookOpen,
  ClipboardText,
  Sparkle,
  UserCircle,
  Tag,
  MagnifyingGlass,
  Compass,
  Users,
  GraduationCap,
  ArrowRight,
  CheckCircle,
  Circle,
  FolderOpen,
  Lightbulb,
  Rocket,
} from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ============================
// ONBOARDING STEPS
// ============================

interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  icon: any;
  completed: boolean;
  href: string;
  actionLabel: string;
}

function getStudentOnboardingSteps(profile: any): OnboardingStep[] {
  const p = profile?.data;
  const hasBio = !!p?.bio;
  const hasTags = p?.tags?.length > 0;
  const hasYear = !!p?.year;
  const hasDepartment = !!p?.department;

  return [
    {
      id: "profile",
      label: "Profilini Tamamla",
      description: "Ad, bölüm, sınıf ve biyografini ekle",
      icon: UserCircle,
      completed: hasBio && hasYear && hasDepartment,
      href: "/profile",
      actionLabel: "Profili Düzenle",
    },
    {
      id: "tags",
      label: "İlgi Alanlarını Seç",
      description: "Seni tanımlayan tag'leri ekle (en az 1)",
      icon: Tag,
      completed: hasTags,
      href: "/profile",
      actionLabel: "Tag Ekle",
    },
    {
      id: "matching",
      label: "Akademisyen Eşleştir",
      description: "Sana en uygun hocaları bul",
      icon: MagnifyingGlass,
      completed: false,
      href: "/matching",
      actionLabel: "Eşleştirmeye Git",
    },
    {
      id: "discover",
      label: "Projeleri Keşfet",
      description: "Açık projeleri incele ve başvur",
      icon: Compass,
      completed: false,
      href: "/discover",
      actionLabel: "Keşfet",
    },
  ];
}

function getProfOnboardingSteps(profile: any): OnboardingStep[] {
  const p = profile?.data;
  const hasBio = !!p?.bio;
  const hasTags = p?.tags?.length > 0;
  const hasProjects = (p?._count?.projects || 0) > 0;
  const hasPublications = (p?._count?.publications || 0) > 0;

  return [
    {
      id: "profile",
      label: "Profilini Tamamla",
      description: "Bölüm ve biyografini ekle",
      icon: UserCircle,
      completed: hasBio,
      href: "/profile",
      actionLabel: "Profili Düzenle",
    },
    {
      id: "tags",
      label: "İlgi Alanlarını Seç",
      description: "Uzmanlık alanlarını belirle",
      icon: Tag,
      completed: hasTags,
      href: "/profile",
      actionLabel: "Tag Ekle",
    },
    {
      id: "project",
      label: "İlk Projeyi Oluştur",
      description: "Öğrenci arayan bir proje ekle",
      icon: Briefcase,
      completed: hasProjects,
      href: "/projects/new",
      actionLabel: "Proje Oluştur",
    },
    {
      id: "publication",
      label: "Yayın Ekle",
      description: "Makalelerini platforma ekle",
      icon: BookOpen,
      completed: hasPublications,
      href: "/publications/new",
      actionLabel: "Yayın Ekle",
    },
  ];
}

function OnboardingCard({ steps }: { steps: OnboardingStep[] }) {
  const completedCount = steps.filter((s) => s.completed).length;
  const progress = Math.round((completedCount / steps.length) * 100);
  const allDone = completedCount === steps.length;

  // Sadece ilk tamamlanmamış adımı büyük göster, gerisini küçük
  const nextStep = steps.find((s) => !s.completed);

  return (
    <Card className={cn(allDone && "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Rocket size={22} weight="duotone" className="text-primary" />
            {allDone ? "Profil Tamamlandı! 🎉" : "Başlangıç Adımları"}
          </CardTitle>
          <Badge variant={allDone ? "default" : "secondary"} className="text-xs">
            {completedCount}/{steps.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step) => (
          <Link key={step.id} href={step.href}>
            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all group",
                step.completed
                  ? "opacity-60"
                  : "hover:bg-accent cursor-pointer",
                step.id === nextStep?.id && !step.completed && "bg-primary/5 border border-primary/20"
              )}
            >
              {step.completed ? (
                <CheckCircle size={22} weight="fill" className="text-emerald-500 flex-shrink-0" />
              ) : (
                <Circle size={22} weight="regular" className="text-muted-foreground flex-shrink-0 group-hover:text-primary" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", step.completed && "line-through")}>{step.label}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {!step.completed && (
                <Button size="sm" variant={step.id === nextStep?.id ? "default" : "ghost"} className="text-xs flex-shrink-0">
                  {step.actionLabel}
                  <ArrowRight size={14} className="ml-1" />
                </Button>
              )}
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================
// QUICK NAV CARDS
// ============================

interface QuickNavItem {
  href: string;
  label: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
}

const studentQuickNav: QuickNavItem[] = [
  {
    href: "/matching",
    label: "Akademisyen Eşleştir",
    description: "Tag'lerine göre en uygun hocaları bul",
    icon: MagnifyingGlass,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100 dark:bg-indigo-950/50",
  },
  {
    href: "/discover",
    label: "Keşfet",
    description: "Projeleri ve akademisyenleri keşfet",
    icon: Compass,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-950/50",
  },
  {
    href: "/professors",
    label: "Akademisyenler",
    description: "Tüm akademisyenleri listele",
    icon: Users,
    color: "text-violet-600",
    bgColor: "bg-violet-100 dark:bg-violet-950/50",
  },
  {
    href: "/projects",
    label: "Projeler",
    description: "Açık projelere göz at",
    icon: Briefcase,
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-950/50",
  },
  {
    href: "/my-applications",
    label: "Başvurularım",
    description: "Başvurularının durumunu takip et",
    icon: ClipboardText,
    color: "text-sky-600",
    bgColor: "bg-sky-100 dark:bg-sky-950/50",
  },
  {
    href: "/profile",
    label: "Profilim",
    description: "Profil bilgilerini düzenle",
    icon: UserCircle,
    color: "text-rose-600",
    bgColor: "bg-rose-100 dark:bg-rose-950/50",
  },
];

const profQuickNav: QuickNavItem[] = [
  {
    href: "/discover",
    label: "Öğrenci Keşfet",
    description: "Sana uygun öğrencileri bul",
    icon: Compass,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-950/50",
  },
  {
    href: "/projects/new",
    label: "Proje Oluştur",
    description: "Yeni bir proje ilanı aç",
    icon: Briefcase,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100 dark:bg-indigo-950/50",
  },
  {
    href: "/publications/new",
    label: "Yayın Ekle",
    description: "Makale veya yayınını ekle",
    icon: BookOpen,
    color: "text-violet-600",
    bgColor: "bg-violet-100 dark:bg-violet-950/50",
  },
  {
    href: "/my-projects",
    label: "Projelerim",
    description: "Projelerini yönet",
    icon: FolderOpen,
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-950/50",
  },
  {
    href: "/incoming-applications",
    label: "Gelen Başvurular",
    description: "Öğrenci başvurularını incele",
    icon: ClipboardText,
    color: "text-sky-600",
    bgColor: "bg-sky-100 dark:bg-sky-950/50",
  },
  {
    href: "/professors",
    label: "Akademisyenler",
    description: "Diğer akademisyenleri gör",
    icon: Users,
    color: "text-sky-600",
    bgColor: "bg-sky-100 dark:bg-sky-950/50",
  },
  {
    href: "/profile",
    label: "Profilim",
    description: "Profil bilgilerini düzenle",
    icon: UserCircle,
    color: "text-rose-600",
    bgColor: "bg-rose-100 dark:bg-rose-950/50",
  },
];

function QuickNavGrid({ items }: { items: QuickNavItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item) => (
        <Link key={item.href} href={item.href}>
          <Card className="hover:shadow-md transition-all hover:border-primary/30 cursor-pointer h-full group">
            <CardContent className="p-4 flex items-start gap-3">
              <div className={cn("flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center", item.bgColor)}>
                <item.icon size={22} weight="duotone" className={item.color} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">{item.label}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              </div>
              <ArrowRight size={16} className="flex-shrink-0 text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

// ============================
// STAT CARDS
// ============================

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon size={20} weight="duotone" className="text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================
// STUDENT DASHBOARD
// ============================

function StudentDashboard() {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.getMe(),
  });

  const { data: myApps } = useQuery({
    queryKey: ["my-applications"],
    queryFn: () => applicationsApi.myApplications("limit=5"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const steps = getStudentOnboardingSteps(profile);
  const stats = profile?.data?._count || {};
  const pendingApps = myApps?.data?.filter((a: any) => a.status === "PENDING").length || 0;
  const acceptedApps = myApps?.data?.filter((a: any) => a.status === "ACCEPTED").length || 0;

  return (
    <div className="space-y-8">
      {/* İstatistikler */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={ClipboardText} label="Toplam Başvuru" value={stats.applications || 0} />
        <StatCard icon={Sparkle} label="Bekleyen" value={pendingApps} />
        <StatCard icon={Briefcase} label="Kabul Edilen" value={acceptedApps} />
      </div>

      {/* Onboarding */}
      <OnboardingCard steps={steps} />

      {/* Hızlı Navigasyon */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Lightbulb size={20} weight="duotone" className="text-primary" />
          Hızlı Erişim
        </h2>
        <QuickNavGrid items={studentQuickNav} />
      </div>
    </div>
  );
}

// ============================
// PROFESSOR DASHBOARD
// ============================

function ProfessorDashboard() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.getMe(),
  });

  const { data: recStudents, isLoading: loadingStudents } = useQuery({
    queryKey: ["discover-students"],
    queryFn: () => discoverApi.students("limit=4"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const steps = getProfOnboardingSteps(profile);
  const stats = profile?.data?._count || {};

  return (
    <div className="space-y-8">
      {/* İstatistikler */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Briefcase} label="Projelerim" value={stats.projects || 0} />
        <StatCard icon={BookOpen} label="Yayınlarım" value={stats.publications || 0} />
        <Link href="/incoming-applications" className="block group">
          <Card className="group-hover:border-primary/40 group-hover:shadow-md transition-all">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ClipboardText size={20} weight="duotone" className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold">{stats.applications || 0}</p>
                <p className="text-sm text-muted-foreground">Gelen Başvuru</p>
              </div>
              <ArrowRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Onboarding */}
      <OnboardingCard steps={steps} />

      {/* Hızlı Navigasyon */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Lightbulb size={20} weight="duotone" className="text-primary" />
          Hızlı Erişim
        </h2>
        <QuickNavGrid items={profQuickNav} />
      </div>

      {/* Önerilen Öğrenciler */}
      {(recStudents?.data?.length || 0) > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Sana Uygun Öğrenciler</h2>
            <Link href="/discover">
              <Button variant="ghost" size="sm">Tümünü Gör</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(recStudents?.data || []).slice(0, 4).map((s: any) => (
              <ProfileCard key={s.id} {...s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ============================
// MAIN PAGE
// ============================

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">
        Hoş geldin, {user?.name?.split(" ")[0]}! 👋
      </h1>
      <p className="text-muted-foreground mb-8">
        {user?.role === "PROFESSOR"
          ? "Projelerinizi yönetin ve uygun öğrencileri keşfedin"
          : "Profilini tamamla, akademisyenlerle eşleş ve projeleri keşfet"}
      </p>
      {user?.role === "PROFESSOR" ? <ProfessorDashboard /> : <StudentDashboard />}
    </div>
  );
}
