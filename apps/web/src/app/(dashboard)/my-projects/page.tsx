"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { projectsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TagBadge } from "@/components/tag-badge";
import { InviteModal } from "@/components/invite-modal";
import { Plus, Trash, UserPlus, Users, EnvelopeSimple } from "@phosphor-icons/react";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  OPEN: { label: "Açık", variant: "default" },
  IN_PROGRESS: { label: "Devam", variant: "secondary" },
  CLOSED: { label: "Kapalı", variant: "destructive" },
};

export default function MyProjectsPage() {
  const { user } = useAuth();
  const [inviteOpen, setInviteOpen] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["my-projects"],
    queryFn: () => projectsApi.mine(),
  });

  const projects: any[] = data?.data || [];
  const owned = projects.filter((p) => p.isOwner);
  const joined = projects.filter((p) => !p.isOwner);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Projelerim</h1>
        {user?.role === "PROFESSOR" && (
          <Link href="/projects/new">
            <Button>
              <Plus size={18} className="mr-1" /> Yeni Proje
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Henüz hiçbir projede yer almıyorsunuz
          </p>
          {user?.role === "PROFESSOR" ? (
            <Link href="/projects/new">
              <Button>İlk Projenizi Oluşturun</Button>
            </Link>
          ) : (
            <Link href="/projects">
              <Button>Projeleri Keşfedin</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {owned.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">
                Sahibi olduklarım ({owned.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {owned.map((p) => (
                  <OwnerProjectCard
                    key={p.id}
                    project={p}
                    onInvite={() => setInviteOpen(p.id)}
                  />
                ))}
              </div>
            </section>
          )}
          {joined.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">
                Üyesi olduklarım ({joined.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {joined.map((p) => (
                  <MemberProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {inviteOpen && (
        <InviteModal
          projectId={inviteOpen}
          project={projects.find((p) => p.id === inviteOpen)}
          onClose={() => setInviteOpen(null)}
        />
      )}
    </div>
  );
}

function ProjectMeta({ project }: { project: any }) {
  const s = statusLabels[project.status] || statusLabels.OPEN;
  const studentCount = project.members?.filter((m: any) => m.role === "STUDENT").length || 0;
  const profCount = project.members?.filter((m: any) => m.role === "PROFESSOR").length || 0;
  return (
    <>
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          href={`/projects/${project.id}`}
          className="font-semibold hover:text-primary"
        >
          {project.title}
        </Link>
        <Badge variant={s.variant}>{s.label}</Badge>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2">
        {project.description}
      </p>
      {project.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {project.tags.slice(0, 4).map((t: any) => (
            <TagBadge key={t.id} name={t.name} category={t.category} />
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <Users size={14} /> Hoca: {profCount}/{project.professorSlots}
        </span>
        <span className="flex items-center gap-1">
          <Users size={14} /> Öğrenci: {studentCount}/{project.studentSlots}
        </span>
        {project._count?.invites > 0 && (
          <span className="flex items-center gap-1 text-amber-600 font-medium">
            <EnvelopeSimple size={14} weight="duotone" />
            {project._count.invites} davet bekliyor
          </span>
        )}
      </div>
    </>
  );
}

function MemberProjectCard({ project }: { project: any }) {
  return (
    <Card>
      <CardContent className="p-5">
        <ProjectMeta project={project} />
        <div className="flex justify-end mt-3">
          <Link href={`/projects/${project.id}`}>
            <Button size="sm" variant="outline">Aç</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function OwnerProjectCard({
  project,
  onInvite,
}: {
  project: any;
  onInvite: () => void;
}) {
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: () => projectsApi.delete(project.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-projects"] });
    },
  });

  const confirmDelete = () => {
    if (window.confirm(`"${project.title}" projesini silmek istediğine emin misin? Tüm başvurular ve davetler silinecek.`)) {
      remove.mutate();
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <ProjectMeta project={project} />
        <div className="flex flex-wrap gap-2 mt-4">
          <Button size="sm" onClick={onInvite}>
            <UserPlus size={14} className="mr-1" /> Davet Et
          </Button>
          <Link href={`/projects/${project.id}`}>
            <Button size="sm" variant="outline">Detay / Düzenle</Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={confirmDelete}
            disabled={remove.isPending}
          >
            <Trash size={14} className="mr-1" />
            {remove.isPending ? "Siliniyor..." : "Sil"}
          </Button>
        </div>
        {remove.isError && (
          <p className="text-destructive text-xs mt-2">
            {(remove.error as any)?.message || "Silinemedi"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}


