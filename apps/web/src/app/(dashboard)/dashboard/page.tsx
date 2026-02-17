"use client";

import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { discoverApi, applicationsApi, profileApi } from "@/lib/api";
import { ProfileCard } from "@/components/profile-card";
import { ProjectCard } from "@/components/project-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  ClipboardText,
  BookOpen,
  Sparkle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number | string;
}) {
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

function StudentDashboard() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.getMe(),
  });

  const { data: recProjects, isLoading: loadingProjects } = useQuery({
    queryKey: ["discover-projects"],
    queryFn: () => discoverApi.projects("limit=4"),
  });

  const { data: recProfs, isLoading: loadingProfs } = useQuery({
    queryKey: ["discover-professors"],
    queryFn: () => discoverApi.professors("limit=4"),
  });

  const { data: myApps } = useQuery({
    queryKey: ["my-applications"],
    queryFn: () => applicationsApi.myApplications("limit=5"),
  });

  const stats = profile?.data?._count || {};
  const pendingApps =
    myApps?.data?.filter((a: any) => a.status === "PENDING").length || 0;
  const acceptedApps =
    myApps?.data?.filter((a: any) => a.status === "ACCEPTED").length || 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={ClipboardText} label="Toplam Başvuru" value={stats.applications || 0} />
        <StatCard icon={Sparkle} label="Bekleyen" value={pendingApps} />
        <StatCard icon={Briefcase} label="Kabul Edilen" value={acceptedApps} />
      </div>

      {/* Önerilen Projeler */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Sana Uygun Projeler</h2>
          <Link href="/discover">
            <Button variant="ghost" size="sm">Tümünü Gör</Button>
          </Link>
        </div>
        {loadingProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(recProjects?.data || []).slice(0, 4).map((p: any) => (
              <ProjectCard key={p.id} {...p} />
            ))}
            {recProjects?.data?.length === 0 && (
              <p className="text-muted-foreground col-span-2">
                Profilinize tag ekleyerek öneri almaya başlayın
              </p>
            )}
          </div>
        )}
      </section>

      {/* Önerilen Hocalar */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Sana Uygun Akademisyenler</h2>
          <Link href="/discover">
            <Button variant="ghost" size="sm">Tümünü Gör</Button>
          </Link>
        </div>
        {loadingProfs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(recProfs?.data || []).slice(0, 4).map((p: any) => (
              <ProfileCard key={p.id} {...p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProfessorDashboard() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.getMe(),
  });

  const { data: recStudents, isLoading: loadingStudents } = useQuery({
    queryKey: ["discover-students"],
    queryFn: () => discoverApi.students("limit=4"),
  });

  const stats = profile?.data?._count || {};

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Briefcase} label="Projelerim" value={stats.projects || 0} />
        <StatCard icon={BookOpen} label="Yayınlarım" value={stats.publications || 0} />
        <StatCard icon={ClipboardText} label="Gelen Başvuru" value={stats.applications || 0} />
      </div>

      <div className="flex gap-3">
        <Link href="/projects/new">
          <Button>Yeni Proje Oluştur</Button>
        </Link>
        <Link href="/publications/new">
          <Button variant="outline">Yayın Ekle</Button>
        </Link>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Sana Uygun Öğrenciler</h2>
          <Link href="/discover">
            <Button variant="ghost" size="sm">Tümünü Gör</Button>
          </Link>
        </div>
        {loadingStudents ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(recStudents?.data || []).slice(0, 4).map((s: any) => (
              <ProfileCard key={s.id} {...s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

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
          : "Projeleri keşfedin ve akademisyenlerle bağlantı kurun"}
      </p>
      {user?.role === "PROFESSOR" ? <ProfessorDashboard /> : <StudentDashboard />}
    </div>
  );
}
