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
import { InviteModal } from "@/components/invite-modal";
import {
  ArrowLeft,
  Users,
  PaperPlaneTilt,
  Check,
  X,
  UserPlus,
  GraduationCap,
  UserCircle,
  Crown,
  ChatCircle,
  Minus,
  Plus,
  EnvelopeSimple,
  Clock,
} from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const statusLabels: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  OPEN: { label: "Açık", variant: "default" },
  IN_PROGRESS: { label: "Devam Ediyor", variant: "secondary" },
  CLOSED: { label: "Kapalı", variant: "destructive" },
};

function getInitials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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
  const [showInvite, setShowInvite] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.getById(id),
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      applicationsApi.apply(id, { message: message || undefined }),
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

  const slotsMutation = useMutation({
    mutationFn: (body: { studentSlots?: number; professorSlots?: number }) =>
      projectsApi.update(id, body),
    onMutate: async (body) => {
      // Optimistic update — anlaık tepki
      await queryClient.cancelQueries({ queryKey: ["project", id] });
      const previous = queryClient.getQueryData<any>(["project", id]);
      queryClient.setQueryData(["project", id], (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: { ...old.data, ...body } };
      });
      return { previous };
    },
    onError: (_err, _body, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["project", id], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["my-projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  if (isLoading) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  const project = data?.data;
  if (!project) return <p>Proje bulunamadı</p>;

  const s = statusLabels[project.status] || statusLabels.OPEN;
  const isOwner = user?.id === project.owner?.id;
  const isMember = project.members?.some((m: any) => m.user?.id === user?.id);
  const alreadyApplied = project.applications?.some(
    (a: any) => a.applicant?.id === user?.id
  );
  const studentMembers =
    project.members?.filter((m: any) => m.role === "STUDENT") || [];
  const profMembers =
    project.members?.filter((m: any) => m.role === "PROFESSOR") || [];
  const studentCount = studentMembers.length;
  const profCount = profMembers.length;
  const canApply =
    !isOwner && !isMember && !alreadyApplied && project.status === "OPEN";
  const studentFull = studentCount >= (project.studentSlots ?? 0);
  const profFull = profCount >= (project.professorSlots ?? 0);

  const pendingApps =
    project.applications?.filter((a: any) => a.status === "PENDING") || [];
  const resolvedApps =
    project.applications?.filter((a: any) => a.status !== "PENDING") || [];

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

          <Link
            href={`/professors/${project.owner?.id}`}
            className="text-sm text-primary hover:underline mt-1 block"
          >
            {project.owner?.name} — {project.owner?.department}
          </Link>

          <p className="mt-4 text-sm whitespace-pre-wrap">
            {project.description}
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {project.tags?.map((tag: any) => (
              <TagBadge key={tag.id} name={tag.name} category={tag.category} />
            ))}
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <UserCircle size={16} weight="duotone" /> Hoca: {profCount}/
              {project.professorSlots}
            </span>
            <span className="flex items-center gap-1">
              <GraduationCap size={16} weight="duotone" /> Öğrenci:{" "}
              {studentCount}/{project.studentSlots}
            </span>
            <span>{project._count?.applications || 0} başvuru</span>
          </div>

          {/* Owner aksiyonları */}
          {isOwner && (
            <div className="flex flex-wrap gap-2 mt-5">
              <Button
                size="sm"
                onClick={() => setShowInvite(true)}
                disabled={studentFull && profFull}
              >
                <UserPlus size={16} className="mr-1" />
                Üye Davet Et
                {studentFull && profFull && (
                  <span className="ml-1 text-xs opacity-80">
                    (kontenjan dolu)
                  </span>
                )}
              </Button>
            </div>
          )}

          {/* Başvuru */}
          {canApply && (
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
          {alreadyApplied && !isMember && (
            <p className="mt-4 text-sm text-muted-foreground">
              ✅ Bu projeye zaten başvurdunuz
            </p>
          )}
          {isMember && !isOwner && (
            <p className="mt-4 text-sm text-emerald-600">
              ✓ Bu projenin üyesisiniz
            </p>
          )}
        </CardContent>
      </Card>

      {/* Üyeler — gruplanmış görünüm */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Users size={20} weight="duotone" />
            Ekip
            <Badge variant="outline" className="ml-1">
              {project.members?.length || 0}
            </Badge>
          </CardTitle>
          {isOwner && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowInvite(true)}
              disabled={studentFull && profFull}
            >
              <UserPlus size={14} className="mr-1" /> Davet Et
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Akademisyenler */}
          <MemberGroup
            title="Akademisyenler"
            icon={UserCircle}
            members={profMembers}
            ownerId={project.owner?.id}
            slots={project.professorSlots}
            emptyText="Henüz akademisyen yok"
            canEditSlots={isOwner}
            minSlots={Math.max(profCount, 1)}
            maxSlots={20}
            onSlotsChange={(n) =>
              slotsMutation.mutate({ professorSlots: n })
            }
            isUpdating={slotsMutation.isPending}
          />

          <Separator />

          {/* Öğrenciler */}
          <MemberGroup
            title="Öğrenciler"
            icon={GraduationCap}
            members={studentMembers}
            ownerId={project.owner?.id}
            slots={project.studentSlots}
            emptyText="Henüz öğrenci yok"
            canEditSlots={isOwner}
            minSlots={Math.max(studentCount, 0)}
            maxSlots={50}
            onSlotsChange={(n) =>
              slotsMutation.mutate({ studentSlots: n })
            }
            isUpdating={slotsMutation.isPending}
          />
        </CardContent>
      </Card>

      {/* Davet edilenler (sadece owner) */}
      {isOwner && project.invites?.length > 0 && (
        <InvitesCard invites={project.invites} />
      )}

      {/* Başvurular (sadece owner) */}
      {isOwner && project.applications?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Başvurular
              <Badge variant="outline">{project.applications.length}</Badge>
              {pendingApps.length > 0 && (
                <Badge className="bg-amber-500 hover:bg-amber-500">
                  {pendingApps.length} bekliyor
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...pendingApps, ...resolvedApps].map((app: any, idx: number) => {
              const appInitials = getInitials(app.applicant?.name);

              return (
                <div key={app.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {appInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <span className="font-medium text-sm">
                          {app.applicant?.name}
                        </span>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          {app.applicant?.role === "PROFESSOR" ? (
                            <UserCircle size={12} weight="duotone" />
                          ) : (
                            <GraduationCap size={12} weight="duotone" />
                          )}
                          {app.applicant?.department}
                        </p>
                        {app.message && (
                          <div className="mt-2 rounded-md bg-muted/40 border border-border/60 p-2">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                              <ChatCircle size={11} weight="duotone" />
                              Mesaj
                            </div>
                            <p className="text-sm whitespace-pre-wrap">
                              {app.message}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {app.status === "PENDING" ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({
                                appId: app.id,
                                status: "ACCEPTED",
                              })
                            }
                          >
                            <Check size={14} className="mr-1" /> Kabul
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-rose-600 border-rose-200 hover:bg-rose-50"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({
                                appId: app.id,
                                status: "REJECTED",
                              })
                            }
                          >
                            <X size={14} className="mr-1" /> Red
                          </Button>
                        </>
                      ) : (
                        <Badge
                          variant={
                            app.status === "ACCEPTED"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {app.status === "ACCEPTED"
                            ? "Kabul Edildi"
                            : "Reddedildi"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {idx < project.applications.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {showInvite && (
        <InviteModal
          projectId={project.id}
          project={project}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
}

function InvitesCard({ invites }: { invites: any[] }) {
  const grouped = {
    PENDING: invites.filter((i) => i.status === "PENDING"),
    ACCEPTED: invites.filter((i) => i.status === "ACCEPTED"),
    REJECTED: invites.filter((i) => i.status === "REJECTED"),
  };

  const statusMeta: Record<
    string,
    {
      label: string;
      icon: any;
      color: string;
      textColor: string;
      borderColor: string;
    }
  > = {
    PENDING: {
      label: "Bekliyor",
      icon: Clock,
      color: "bg-amber-100 text-amber-700",
      textColor: "text-amber-700",
      borderColor: "border-amber-200",
    },
    ACCEPTED: {
      label: "Kabul",
      icon: Check,
      color: "bg-emerald-100 text-emerald-700",
      textColor: "text-emerald-700",
      borderColor: "border-emerald-200",
    },
    REJECTED: {
      label: "Red",
      icon: X,
      color: "bg-rose-100 text-rose-700",
      textColor: "text-rose-700",
      borderColor: "border-rose-200",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EnvelopeSimple size={20} weight="duotone" />
          Davet Ettiklerin
          <Badge variant="outline">{invites.length}</Badge>
          {grouped.PENDING.length > 0 && (
            <Badge className="bg-amber-500 hover:bg-amber-500">
              {grouped.PENDING.length} bekliyor
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {[...grouped.PENDING, ...grouped.ACCEPTED, ...grouped.REJECTED].map(
          (inv: any) => {
            const meta = statusMeta[inv.status] || statusMeta.PENDING;
            const StatusIcon = meta.icon;
            return (
              <div
                key={inv.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border p-3",
                  meta.borderColor,
                  "bg-background"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(inv.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <span className="font-medium text-sm truncate block">
                      {inv.user?.name}
                    </span>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {inv.invitedRole === "PROFESSOR" ? (
                        <UserCircle size={12} weight="duotone" />
                      ) : (
                        <GraduationCap size={12} weight="duotone" />
                      )}
                      {inv.invitedRole === "PROFESSOR"
                        ? "Akademisyen"
                        : "Öğrenci"}{" "}
                      • {inv.user?.department || "—"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn("gap-1 flex-shrink-0", meta.color)}
                >
                  <StatusIcon size={12} weight="bold" />
                  {meta.label}
                </Badge>
              </div>
            );
          }
        )}
      </CardContent>
    </Card>
  );
}

function MemberGroup({
  title,
  icon: Icon,
  members,
  ownerId,
  slots,
  emptyText,
  canEditSlots = false,
  minSlots = 0,
  maxSlots = 99,
  onSlotsChange,
  isUpdating = false,
}: {
  title: string;
  icon: any;
  members: any[];
  ownerId?: string;
  slots: number;
  emptyText: string;
  canEditSlots?: boolean;
  minSlots?: number;
  maxSlots?: number;
  onSlotsChange?: (n: number) => void;
  isUpdating?: boolean;
}) {
  const filled = members.length;
  const canDecrement = canEditSlots && slots > minSlots && slots > 1;
  const canIncrement = canEditSlots && slots < maxSlots;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-3">
        <h3 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground">
          <Icon size={16} weight="duotone" />
          {title}
        </h3>
        {canEditSlots ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground tabular-nums">
              <span className="font-medium text-foreground">{filled}</span>
              <span className="mx-0.5">/</span>
            </span>
            <div className="inline-flex items-center rounded-md border bg-background shadow-sm">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-r-none"
                disabled={!canDecrement || isUpdating}
                onClick={() => onSlotsChange?.(slots - 1)}
                title={
                  !canDecrement
                    ? `En az ${Math.max(minSlots, 1)} kontenjan gerekli`
                    : "Azalt"
                }
              >
                <Minus size={12} weight="bold" />
              </Button>
              <span className="px-2 text-sm font-semibold tabular-nums min-w-[28px] text-center select-none">
                {slots}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-l-none"
                disabled={!canIncrement || isUpdating}
                onClick={() => onSlotsChange?.(slots + 1)}
                title={!canIncrement ? `En fazla ${maxSlots}` : "Artır"}
              >
                <Plus size={12} weight="bold" />
              </Button>
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground tabular-nums">
            {filled}/{slots}
          </span>
        )}
      </div>
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {members.map((m: any) => {
            const isOwner = m.user?.id === ownerId;
            return (
              <div
                key={m.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg p-2",
                  isOwner && "bg-primary/5"
                )}
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(m.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm flex items-center gap-1.5">
                    {m.user?.name}
                    {isOwner && (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-primary/40 text-primary gap-0.5 px-1.5 py-0"
                      >
                        <Crown size={10} weight="fill" />
                        Sahip
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {m.user?.department || "—"}
                    {m.user?.year ? ` • ${m.user.year}. sınıf` : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
