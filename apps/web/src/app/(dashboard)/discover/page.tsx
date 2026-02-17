"use client";

import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { discoverApi } from "@/lib/api";
import { ProfileCard } from "@/components/profile-card";
import { ProjectCard } from "@/components/project-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function DiscoverPage() {
  const { user } = useAuth();
  const isProf = user?.role === "PROFESSOR";

  const { data: professors, isLoading: lp } = useQuery({
    queryKey: ["discover-professors"],
    queryFn: () => discoverApi.professors("limit=20"),
    enabled: !isProf,
  });

  const { data: projects, isLoading: lpr } = useQuery({
    queryKey: ["discover-projects"],
    queryFn: () => discoverApi.projects("limit=20"),
    enabled: !isProf,
  });

  const { data: students, isLoading: ls } = useQuery({
    queryKey: ["discover-students"],
    queryFn: () => discoverApi.students("limit=20"),
    enabled: isProf,
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Keşfet</h1>
      <p className="text-muted-foreground mb-6">
        Tag eşleşmesine göre size önerilen{" "}
        {isProf ? "öğrenciler" : "akademisyenler ve projeler"}
      </p>

      {isProf ? (
        // Hoca: öğrenciler
        <div>
          <h2 className="text-xl font-semibold mb-4">Önerilen Öğrenciler</h2>
          {ls ? (
            <LoadingGrid />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(students?.data || []).map((s: any) => (
                <ProfileCard key={s.id} {...s} />
              ))}
              {students?.data?.length === 0 && <EmptyState />}
            </div>
          )}
        </div>
      ) : (
        // Öğrenci: hocalar + projeler
        <Tabs defaultValue="projects">
          <TabsList>
            <TabsTrigger value="projects">Projeler</TabsTrigger>
            <TabsTrigger value="professors">Akademisyenler</TabsTrigger>
          </TabsList>
          <TabsContent value="projects" className="mt-4">
            {lpr ? (
              <LoadingGrid />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(projects?.data || []).map((p: any) => (
                  <ProjectCard key={p.id} {...p} />
                ))}
                {projects?.data?.length === 0 && <EmptyState />}
              </div>
            )}
          </TabsContent>
          <TabsContent value="professors" className="mt-4">
            {lp ? (
              <LoadingGrid />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(professors?.data || []).map((p: any) => (
                  <ProfileCard key={p.id} {...p} />
                ))}
                {professors?.data?.length === 0 && <EmptyState />}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-48 rounded-xl" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <p className="text-muted-foreground col-span-3 text-center py-12">
      Profilinize tag ekleyerek öneri almaya başlayın
    </p>
  );
}
