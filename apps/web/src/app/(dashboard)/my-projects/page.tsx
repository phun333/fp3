"use client";

import { useQuery } from "@tanstack/react-query";
import { profileApi } from "@/lib/api";
import { ProjectCard } from "@/components/project-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "@phosphor-icons/react";
import Link from "next/link";

export default function MyProjectsPage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.getMe(),
  });

  // Profil endpoint'i projeleri içermediği için professors endpoint kullanıyoruz
  const userId = profile?.data?.id;

  const { data: profData, isLoading: loadingProf } = useQuery({
    queryKey: ["professor", userId],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/professors/${userId}`,
        { credentials: "include" }
      );
      return res.json();
    },
    enabled: !!userId,
  });

  const loading = isLoading || loadingProf;
  const projects = profData?.data?.projects || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Projelerim</h1>
        <Link href="/projects/new">
          <Button>
            <Plus size={18} className="mr-1" /> Yeni Proje
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p: any) => (
              <ProjectCard
                key={p.id}
                {...p}
                owner={{
                  id: profile?.data?.id,
                  name: profile?.data?.name,
                  department: profile?.data?.department,
                }}
              />
            ))}
          </div>
          {projects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Henüz projeniz yok</p>
              <Link href="/projects/new">
                <Button>İlk Projenizi Oluşturun</Button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
