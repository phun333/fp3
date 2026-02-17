"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { professorsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TagBadge } from "@/components/tag-badge";
import { ProjectCard } from "@/components/project-card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Briefcase, ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProfessorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, isLoading } = useQuery({
    queryKey: ["professor", id],
    queryFn: () => professorsApi.getById(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const prof = data?.data;
  if (!prof) return <p>Akademisyen bulunamadı</p>;

  const initials = prof.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/professors">
        <Button variant="ghost" size="sm">
          <ArrowLeft size={16} className="mr-1" /> Geri
        </Button>
      </Link>

      {/* Profil */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{prof.name}</h1>
              <p className="text-muted-foreground">{prof.department}</p>
              <p className="text-sm text-muted-foreground">{prof.email}</p>
              {prof.bio && (
                <p className="mt-3 text-sm">{prof.bio}</p>
              )}
              {prof.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {prof.tags.map((tag: any) => (
                    <TagBadge key={tag.id} name={tag.name} category={tag.category} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projeler */}
      {prof.projects?.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Briefcase size={22} weight="duotone" className="text-primary" />
            Projeler ({prof.projects.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prof.projects.map((p: any) => (
              <ProjectCard
                key={p.id}
                {...p}
                owner={{ id: prof.id, name: prof.name, department: prof.department }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Yayınlar */}
      {prof.publications?.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen size={22} weight="duotone" className="text-primary" />
            Yayınlar ({prof.publications.length})
          </h2>
          <div className="space-y-3">
            {prof.publications.map((pub: any) => (
              <Card key={pub.id}>
                <CardContent className="p-4">
                  <h3 className="font-medium">{pub.title}</h3>
                  {pub.year && (
                    <p className="text-sm text-muted-foreground">{pub.year}</p>
                  )}
                  {pub.abstract && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {pub.abstract}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {pub.tags?.map((tag: any) => (
                      <TagBadge key={tag.id} name={tag.name} category={tag.category} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
