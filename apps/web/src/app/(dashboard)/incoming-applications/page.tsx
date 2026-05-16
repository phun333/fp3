"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { applicationsApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { TagBadge } from "@/components/tag-badge";
import { cn } from "@/lib/utils";
import {
  Tray,
  Check,
  X,
  Clock,
  ClipboardText,
  Briefcase,
  GraduationCap,
  ArrowRight,
  ChatCircle,
  ArrowsClockwise,
} from "@phosphor-icons/react";

type StatusFilter = "ALL" | "PENDING" | "ACCEPTED" | "REJECTED";

const statusMeta: Record<
  Exclude<StatusFilter, "ALL">,
  { label: string; variant: "default" | "secondary" | "destructive"; icon: any; dotClass: string }
> = {
  PENDING: { label: "Beklemede", variant: "secondary", icon: Clock, dotClass: "bg-amber-500" },
  ACCEPTED: { label: "Kabul Edildi", variant: "default", icon: Check, dotClass: "bg-emerald-500" },
  REJECTED: { label: "Reddedildi", variant: "destructive", icon: X, dotClass: "bg-rose-500" },
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

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: number;
  tone: "primary" | "amber" | "emerald" | "rose";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    emerald:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
  }[tone];

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", toneClass)}>
          <Icon size={20} weight="duotone" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-sm text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function IncomingApplicationsPage() {
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const params = `page=${page}&limit=10${filter !== "ALL" ? `&status=${filter}` : ""}`;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["incoming-applications", filter, page],
    queryFn: () => applicationsApi.incoming(params),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACCEPTED" | "REJECTED" }) =>
      applicationsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incoming-applications"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const counts = data?.counts ?? { total: 0, pending: 0, accepted: 0, rejected: 0 };
  const applications = data?.data ?? [];
  const meta = data?.meta;

  const tabs: { value: StatusFilter; label: string; count: number }[] = [
    { value: "ALL", label: "Tümü", count: counts.total },
    { value: "PENDING", label: "Beklemede", count: counts.pending },
    { value: "ACCEPTED", label: "Kabul Edilen", count: counts.accepted },
    { value: "REJECTED", label: "Reddedilen", count: counts.rejected },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Tray size={28} weight="duotone" className="text-primary" />
            Gelen Başvurular
          </h1>
          <p className="text-muted-foreground mt-1">
            Projelerinize gelen başvuruları inceleyin, kabul edin veya reddedin.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={ClipboardText} label="Toplam" value={counts.total} tone="primary" />
        <StatCard icon={Clock} label="Beklemede" value={counts.pending} tone="amber" />
        <StatCard icon={Check} label="Kabul" value={counts.accepted} tone="emerald" />
        <StatCard icon={X} label="Red" value={counts.rejected} tone="rose" />
      </div>

      {/* Filter Tabs */}
      <Tabs
        value={filter}
        onValueChange={(v) => {
          setFilter(v as StatusFilter);
          setPage(1);
        }}
      >
        <TabsList className="grid grid-cols-4 w-full sm:w-auto sm:inline-flex">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="gap-2">
              <span>{t.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
                  filter === t.value
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {t.count}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Tray size={28} weight="duotone" className="text-primary" />
            </div>
            <h3 className="font-semibold text-lg">
              {filter === "ALL"
                ? "Henüz başvuru gelmemiş"
                : "Bu durumda başvuru yok"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              {filter === "ALL"
                ? "Açık projelerinize öğrenci başvurusu geldikçe burada görünecek."
                : "Filtreyi değiştirerek diğer başvurulara göz atabilirsiniz."}
            </p>
            {filter === "ALL" && (
              <Link href="/my-projects" className="inline-block mt-5">
                <Button variant="outline" size="sm">
                  <Briefcase size={16} className="mr-2" />
                  Projelerimi Yönet
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={cn("space-y-3", isFetching && "opacity-70")}>
          {applications.map((app: any) => {
            const meta = statusMeta[app.status as keyof typeof statusMeta] ?? statusMeta.PENDING;
            const StatusIcon = meta.icon;
            const isPending = app.status === "PENDING";
            const tags = app.applicant?.tags ?? [];
            const projectTags = app.project?.tags ?? [];

            return (
              <Card
                key={app.id}
                className="overflow-hidden hover:shadow-md transition-shadow border-l-4"
                style={{
                  borderLeftColor:
                    app.status === "PENDING"
                      ? "rgb(245 158 11)"
                      : app.status === "ACCEPTED"
                      ? "rgb(16 185 129)"
                      : "rgb(244 63 94)",
                }}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                    {/* Sol: Aday */}
                    <div className="flex gap-4 flex-1 min-w-0">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(app.applicant?.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/profile/${app.applicant?.id}`}
                            className="font-semibold hover:text-primary transition-colors"
                          >
                            {app.applicant?.name}
                          </Link>
                          <Badge variant={meta.variant} className="gap-1">
                            <StatusIcon size={12} weight="bold" />
                            {meta.label}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <GraduationCap size={14} weight="duotone" />
                            {app.applicant?.department}
                            {app.applicant?.year ? ` • ${app.applicant.year}. sınıf` : ""}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span>
                            {new Date(app.createdAt).toLocaleDateString("tr-TR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        {app.applicant?.bio && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {app.applicant.bio}
                          </p>
                        )}

                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {tags.slice(0, 6).map((tag: any) => (
                              <TagBadge key={tag.id} name={tag.name} category={tag.category} />
                            ))}
                            {tags.length > 6 && (
                              <Badge variant="outline" className="text-xs">
                                +{tags.length - 6}
                              </Badge>
                            )}
                          </div>
                        )}

                        {app.message && (
                          <div className="mt-3 rounded-lg bg-muted/40 border border-border/60 p-3">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                              <ChatCircle size={14} weight="duotone" />
                              Başvuru notu
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{app.message}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sağ: Proje + Aksiyonlar */}
                    <div className="flex flex-col gap-3 lg:w-72 lg:flex-shrink-0">
                      <Link
                        href={`/projects/${app.project?.id}`}
                        className="group rounded-lg border border-border/70 bg-muted/30 p-3 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                          <Briefcase size={14} weight="duotone" />
                          Proje
                        </div>
                        <p className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                          {app.project?.title}
                        </p>
                        {projectTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {projectTags.slice(0, 3).map((tag: any) => (
                              <TagBadge key={tag.id} name={tag.name} category={tag.category} />
                            ))}
                          </div>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          Projeye git
                          <ArrowRight size={12} />
                        </span>
                      </Link>

                      {isPending ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({ id: app.id, status: "ACCEPTED" })
                            }
                          >
                            <Check size={16} className="mr-1" weight="bold" />
                            Kabul Et
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({ id: app.id, status: "REJECTED" })
                            }
                          >
                            <X size={16} className="mr-1" weight="bold" />
                            Reddet
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="self-start text-muted-foreground"
                          disabled={statusMutation.isPending}
                          onClick={() =>
                            statusMutation.mutate({
                              id: app.id,
                              status: app.status === "ACCEPTED" ? "REJECTED" : "ACCEPTED",
                            })
                          }
                        >
                          <ArrowsClockwise size={14} className="mr-1" />
                          Kararı değiştir
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {meta.total} başvuru • Sayfa {meta.page} / {meta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Önceki
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sonraki
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
