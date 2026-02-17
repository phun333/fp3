"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { projectsApi, applicationsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TagBadge } from "@/components/tag-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Users,
  PaperPlaneTilt,
  Check,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  OPEN: { label: "Açık", variant: "default" },
  IN_PROGRESS: { label: "Devam Ediyor", variant: "secondary" },
  CLOSED: { label: "Kapalı", variant: "destructive" },
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [showApply, setShowApply] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.getById(id),
  });

  const applyMutation = useMutation({
    mutationFn: () => applicationsApi.apply(id, { message: message || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      setShowApply(false);
      setMessage("");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ appId, status }: { appId: string; status: string }) =>
      applicationsApi.updateStatus(appId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
    },
  });

  if (isLoading) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  const project = data?.data;
  if (!project) return <p>Proje bulunamadı</p>;

  const s = statusLabels[project.status] || statusLabels.OPEN;
  const isOwner = user?.id === project.owner?.id;
  const isStudent = user?.role === "STUDENT";
  const alreadyApplied = project.applications?.some(
    (a: any) => a.applicant?.id === user?.id
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/projects">
        <Button variant="ghost" size="sm">
          <ArrowLeft size={16} className="mr-1" /> Geri
        </Button>
      </Link>

      {/* Proje Detayı */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <Badge variant={s.variant}>{s.label}</Badge>
          </div>

          <Link href={`/professors/${project.owner?.id}`} className="text-sm text-primary hover:underline mt-1 block">
            {project.owner?.name} — {project.owner?.department}
          </Link>

          <p className="mt-4 text-sm whitespace-pre-wrap">{project.description}</p>

          <div className="flex flex-wrap gap-2 mt-4">
            {project.tags?.map((tag: any) => (
              <TagBadge key={tag.id} name={tag.name} category={tag.category} />
            ))}
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users size={16} /> Maks {project.maxMembers} kişi
            </span>
            <span>{project._count?.applications || 0} başvuru</span>
          </div>

          {/* Başvuru */}
          {isStudent && project.status === "OPEN" && !alreadyApplied && (
            <div className="mt-6">
              {showApply ? (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Neden bu projeye katılmak istiyorsunuz? (opsiyonel)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => applyMutation.mutate()}
                      disabled={applyMutation.isPending}
                    >
                      <PaperPlaneTilt size={16} className="mr-1" />
                      {applyMutation.isPending ? "Gönderiliyor..." : "Başvur"}
                    </Button>
                    <Button variant="ghost" onClick={() => setShowApply(false)}>
                      İptal
                    </Button>
                  </div>
                  {applyMutation.isError && (
                    <p className="text-destructive text-sm">
                      {(applyMutation.error as any)?.message || "Hata oluştu"}
                    </p>
                  )}
                </div>
              ) : (
                <Button onClick={() => setShowApply(true)}>
                  <PaperPlaneTilt size={16} className="mr-1" /> Bu Projeye Başvur
                </Button>
              )}
            </div>
          )}
          {alreadyApplied && (
            <p className="mt-4 text-sm text-muted-foreground">
              ✅ Bu projeye zaten başvurdunuz
            </p>
          )}
        </CardContent>
      </Card>

      {/* Başvurular (sadece owner) */}
      {isOwner && project.applications?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Başvurular ({project.applications.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.applications.map((app: any) => {
              const appInitials = (app.applicant?.name || "")
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2);

              return (
                <div key={app.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {appInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{app.applicant?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {app.applicant?.department}
                        </p>
                        {app.message && (
                          <p className="text-sm mt-1">{app.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {app.status === "PENDING" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-600"
                            onClick={() =>
                              statusMutation.mutate({ appId: app.id, status: "ACCEPTED" })
                            }
                          >
                            <Check size={14} className="mr-1" /> Kabul
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() =>
                              statusMutation.mutate({ appId: app.id, status: "REJECTED" })
                            }
                          >
                            <X size={14} className="mr-1" /> Red
                          </Button>
                        </>
                      ) : (
                        <Badge
                          variant={app.status === "ACCEPTED" ? "default" : "destructive"}
                        >
                          {app.status === "ACCEPTED" ? "Kabul Edildi" : "Reddedildi"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Separator className="mt-4" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
