"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  applicationsApi,
  invitationsApi,
  professorApplicationsApi,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { TagBadge } from "@/components/tag-badge";
import { cn } from "@/lib/utils";
import {
  Tray,
  Check,
  X,
  Clock,
  Briefcase,
  GraduationCap,
  ChatCircle,
  ArrowRight,
  ClipboardText,
  PaperPlaneTilt,
  EnvelopeSimple,
  UserCircle,
  Sparkle,
} from "@phosphor-icons/react";

type InboxKey = "applications" | "requests" | "invitations";

type StatusFilter = "ALL" | "PENDING" | "ACCEPTED" | "REJECTED";

const statusMeta: Record<
  Exclude<StatusFilter, "ALL">,
  {
    label: string;
    variant: "default" | "secondary" | "destructive";
    icon: any;
    dotClass: string;
    borderColor: string;
  }
> = {
  PENDING: {
    label: "Beklemede",
    variant: "secondary",
    icon: Clock,
    dotClass: "bg-amber-500",
    borderColor: "rgb(245 158 11)",
  },
  ACCEPTED: {
    label: "Kabul Edildi",
    variant: "default",
    icon: Check,
    dotClass: "bg-emerald-500",
    borderColor: "rgb(16 185 129)",
  },
  REJECTED: {
    label: "Reddedildi",
    variant: "destructive",
    icon: X,
    dotClass: "bg-rose-500",
    borderColor: "rgb(244 63 94)",
  },
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

function formatDate(d?: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  PAGE                                                              */
/* ------------------------------------------------------------------ */

export default function InboxPage() {
  const { user } = useAuth();
  const isProfessor = user?.role === "PROFESSOR";

  // Default selection: professor sees project applications first, students see invitations
  const [active, setActive] = useState<InboxKey>(
    isProfessor ? "applications" : "invitations"
  );

  // --- Project applications (professor only, applicants → my projects)
  const applicationsQuery = useQuery({
    queryKey: ["incoming-applications-all"],
    queryFn: () => applicationsApi.incoming("page=1&limit=50"),
    enabled: isProfessor,
  });

  // --- Professor applications (professor only, students → me directly)
  const requestsQuery = useQuery({
    queryKey: ["professor-applications-incoming"],
    queryFn: () => professorApplicationsApi.incoming(),
    enabled: isProfessor,
  });

  // --- Invitations (anyone, others → me)
  const invitationsQuery = useQuery({
    queryKey: ["invitations"],
    queryFn: () => invitationsApi.mine(),
  });

  const applications = applicationsQuery.data?.data ?? [];
  const requests = requestsQuery.data?.data ?? [];
  const invitations = invitationsQuery.data?.data ?? [];

  const pendingCounts = useMemo(
    () => ({
      applications: applications.filter((a: any) => a.status === "PENDING")
        .length,
      requests: requests.filter((r: any) => r.status === "PENDING").length,
      invitations: invitations.filter((i: any) => i.status === "PENDING").length,
    }),
    [applications, requests, invitations]
  );

  const totalCounts = {
    applications: applications.length,
    requests: requests.length,
    invitations: invitations.length,
  };

  const totalPending =
    pendingCounts.applications +
    pendingCounts.requests +
    pendingCounts.invitations;

  // Sub-rail items
  const items: {
    key: InboxKey;
    label: string;
    description: string;
    icon: any;
    visible: boolean;
    pending: number;
    total: number;
  }[] = [
    {
      key: "applications",
      label: "Proje Başvuruları",
      description: "Öğrencilerin açık projelerine başvuruları",
      icon: Tray,
      visible: isProfessor,
      pending: pendingCounts.applications,
      total: totalCounts.applications,
    },
    {
      key: "requests",
      label: "Öğrenci Talepleri",
      description: "Doğrudan sana gelen proje önerileri",
      icon: ClipboardText,
      visible: isProfessor,
      pending: pendingCounts.requests,
      total: totalCounts.requests,
    },
    {
      key: "invitations",
      label: "Davetlerim",
      description: "Diğer kullanıcılardan gelen davetler",
      icon: EnvelopeSimple,
      visible: true,
      pending: pendingCounts.invitations,
      total: totalCounts.invitations,
    },
  ];

  const visibleItems = items.filter((i) => i.visible);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Tray size={28} weight="duotone" className="text-primary" />
            Gelen Kutusu
          </h1>
          <p className="text-muted-foreground mt-1">
            Sana gelen tüm başvuru, talep ve davetler tek bir yerde.
          </p>
        </div>
        {totalPending > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-2 dark:bg-amber-950/30 dark:border-amber-900">
            <Sparkle
              size={16}
              weight="fill"
              className="text-amber-500"
            />
            <span className="text-sm font-medium text-amber-900 dark:text-amber-200">
              {totalPending} cevap bekliyor
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Sol rail */}
        <nav className="space-y-1 lg:sticky lg:top-4 lg:self-start">
          {visibleItems.map((it) => {
            const isActive = active === it.key;
            const Icon = it.icon;
            return (
              <button
                key={it.key}
                onClick={() => setActive(it.key)}
                className={cn(
                  "w-full text-left rounded-lg px-3 py-2.5 flex items-center gap-3 transition-colors group",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted/60 text-foreground"
                )}
              >
                <Icon
                  size={20}
                  weight={isActive ? "fill" : "duotone"}
                  className={cn(
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium leading-none",
                      isActive ? "text-primary" : ""
                    )}
                  >
                    {it.label}
                  </p>
                  <p
                    className={cn(
                      "text-[11px] mt-1 line-clamp-1",
                      isActive
                        ? "text-primary/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {it.description}
                  </p>
                </div>
                {it.pending > 0 ? (
                  <span className="flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-amber-500 text-white text-xs font-semibold px-1.5 tabular-nums">
                    {it.pending}
                  </span>
                ) : it.total > 0 ? (
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      isActive
                        ? "text-primary/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {it.total}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Sağ içerik */}
        <div className="min-w-0">
          {active === "applications" && isProfessor && (
            <ApplicationsPanel
              query={applicationsQuery}
              items={applications}
            />
          )}
          {active === "requests" && isProfessor && (
            <RequestsPanel query={requestsQuery} items={requests} />
          )}
          {active === "invitations" && (
            <InvitationsPanel
              query={invitationsQuery}
              items={invitations}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                    */
/* ------------------------------------------------------------------ */

function StatusFilterTabs({
  value,
  onChange,
  counts,
}: {
  value: StatusFilter;
  onChange: (v: StatusFilter) => void;
  counts: { all: number; pending: number; accepted: number; rejected: number };
}) {
  const tabs: { value: StatusFilter; label: string; count: number }[] = [
    { value: "ALL", label: "Tümü", count: counts.all },
    { value: "PENDING", label: "Beklemede", count: counts.pending },
    { value: "ACCEPTED", label: "Kabul", count: counts.accepted },
    { value: "REJECTED", label: "Red", count: counts.rejected },
  ];
  return (
    <div className="inline-flex flex-wrap gap-1 bg-muted/60 rounded-lg p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-2",
            value === t.value
              ? "bg-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t.label}
          <span
            className={cn(
              "text-xs rounded-full px-1.5 py-0.5 tabular-nums",
              value === t.value
                ? "bg-primary/15 text-primary"
                : "bg-background/60"
            )}
          >
            {t.count}
          </span>
        </button>
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: any;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-16 text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Icon size={28} weight="duotone" className="text-primary" />
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
          {description}
        </p>
        {action && <div className="mt-5">{action}</div>}
      </CardContent>
    </Card>
  );
}

function LoadingSkeletons() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-36 rounded-xl" />
      ))}
    </div>
  );
}

function useStatusFilter<T extends { status: string }>(items: T[]) {
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const counts = useMemo(
    () => ({
      all: items.length,
      pending: items.filter((i) => i.status === "PENDING").length,
      accepted: items.filter((i) => i.status === "ACCEPTED").length,
      rejected: items.filter((i) => i.status === "REJECTED").length,
    }),
    [items]
  );
  const filtered = useMemo(
    () => (filter === "ALL" ? items : items.filter((i) => i.status === filter)),
    [items, filter]
  );
  return { filter, setFilter, counts, filtered };
}

/* ------------------------------------------------------------------ */
/*  PANEL: Project Applications                                       */
/* ------------------------------------------------------------------ */

function ApplicationsPanel({
  query,
  items,
}: {
  query: ReturnType<typeof useQuery<any>>;
  items: any[];
}) {
  const qc = useQueryClient();
  const { filter, setFilter, counts, filtered } = useStatusFilter(items);

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "ACCEPTED" | "REJECTED";
    }) => applicationsApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incoming-applications-all"] });
      qc.invalidateQueries({ queryKey: ["my-projects"] });
    },
  });

  if (query.isLoading) return <LoadingSkeletons />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">Proje Başvuruları</h2>
          <p className="text-sm text-muted-foreground">
            Açık projelerine başvuran adayları yönet.
          </p>
        </div>
        <StatusFilterTabs
          value={filter}
          onChange={setFilter}
          counts={counts}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Tray}
          title={
            filter === "ALL"
              ? "Henüz başvuru gelmemiş"
              : "Bu durumda başvuru yok"
          }
          description={
            filter === "ALL"
              ? "Açık projelerinize öğrenci başvurusu geldikçe burada görünecek."
              : "Filtreyi değiştirerek diğer başvurulara göz atabilirsin."
          }
          action={
            filter === "ALL" && (
              <Link href="/my-projects">
                <Button variant="outline" size="sm">
                  <Briefcase size={16} className="mr-2" /> Projelerimi Yönet
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div
          className={cn(
            "space-y-3",
            query.isFetching && "opacity-70"
          )}
        >
          {filtered.map((app: any) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onAccept={() =>
                statusMutation.mutate({
                  id: app.id,
                  status: "ACCEPTED",
                })
              }
              onReject={() =>
                statusMutation.mutate({
                  id: app.id,
                  status: "REJECTED",
                })
              }
              isPending={statusMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationCard({
  app,
  onAccept,
  onReject,
  isPending,
}: {
  app: any;
  onAccept: () => void;
  onReject: () => void;
  isPending: boolean;
}) {
  const meta = statusMeta[app.status as keyof typeof statusMeta] ?? statusMeta.PENDING;
  const StatusIcon = meta.icon;
  const tags = app.applicant?.tags ?? [];
  const projectTags = app.project?.tags ?? [];

  return (
    <Card
      className="overflow-hidden hover:shadow-md transition-shadow border-l-4"
      style={{ borderLeftColor: meta.borderColor }}
    >
      <CardContent className="p-5">
        <div className="flex flex-col lg:flex-row lg:items-start gap-5">
          {/* Aday */}
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
                <span>{formatDate(app.createdAt)}</span>
              </div>

              {app.applicant?.bio && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {app.applicant.bio}
                </p>
              )}

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {tags.slice(0, 6).map((tag: any) => (
                    <TagBadge
                      key={tag.id}
                      name={tag.name}
                      category={tag.category}
                    />
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

          {/* Proje + aksiyon */}
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
                    <TagBadge
                      key={tag.id}
                      name={tag.name}
                      category={tag.category}
                    />
                  ))}
                </div>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Projeye git <ArrowRight size={12} />
              </span>
            </Link>

            {app.status === "PENDING" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isPending}
                  onClick={onAccept}
                >
                  <Check size={16} className="mr-1" weight="bold" /> Kabul Et
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                  disabled={isPending}
                  onClick={onReject}
                >
                  <X size={16} className="mr-1" weight="bold" /> Reddet
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  PANEL: Professor Application Requests                             */
/* ------------------------------------------------------------------ */

function RequestsPanel({
  query,
  items,
}: {
  query: ReturnType<typeof useQuery<any>>;
  items: any[];
}) {
  const qc = useQueryClient();
  const { filter, setFilter, counts, filtered } = useStatusFilter(items);

  const respond = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "ACCEPTED" | "REJECTED";
    }) => professorApplicationsApi.respond(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["professor-applications-incoming"] });
      qc.invalidateQueries({ queryKey: ["my-projects"] });
    },
  });

  if (query.isLoading) return <LoadingSkeletons />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">Öğrenci Talepleri</h2>
          <p className="text-sm text-muted-foreground">
            Eşleştirme üzerinden doğrudan sana gelen proje önerileri.{" "}
            <span className="font-medium text-foreground">
              Kabul edersen otomatik proje açılır.
            </span>
          </p>
        </div>
        <StatusFilterTabs
          value={filter}
          onChange={setFilter}
          counts={counts}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardText}
          title={
            filter === "ALL"
              ? "Henüz öğrenci talebi yok"
              : "Bu durumda talep yok"
          }
          description="Öğrenciler eşleştirme akışı üzerinden sana proje önerisi gönderdiğinde burada görünecek."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((app: any) => (
            <RequestCard
              key={app.id}
              app={app}
              onAccept={() => respond.mutate({ id: app.id, status: "ACCEPTED" })}
              onReject={() => respond.mutate({ id: app.id, status: "REJECTED" })}
              isPending={respond.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestCard({
  app,
  onAccept,
  onReject,
  isPending,
}: {
  app: any;
  onAccept: () => void;
  onReject: () => void;
  isPending: boolean;
}) {
  const meta = statusMeta[app.status as keyof typeof statusMeta] ?? statusMeta.PENDING;
  const StatusIcon = meta.icon;

  return (
    <Card
      className="overflow-hidden border-l-4"
      style={{ borderLeftColor: meta.borderColor }}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {getInitials(app.student?.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link
                href={`/profile/${app.student?.id}`}
                className="font-medium text-sm hover:text-primary"
              >
                {app.student?.name}
              </Link>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <GraduationCap size={12} weight="duotone" />
                {app.student?.department}
                {app.student?.year ? ` • ${app.student.year}. sınıf` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge variant={meta.variant} className="gap-1">
              <StatusIcon size={12} weight="bold" />
              {meta.label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {app.purpose === "ARTICLE" ? "📄 Makale" : "🧪 Proje"}
            </Badge>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Önerilen başlık
          </p>
          <p className="font-medium text-sm">{app.title}</p>
          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
            {app.description}
          </p>
          {app.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {app.tags.map((t: any) => (
                <TagBadge key={t.id} name={t.name} category={t.category} />
              ))}
            </div>
          )}
        </div>

        {app.message && (
          <div className="rounded-lg bg-muted/40 border border-border/60 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
              <ChatCircle size={14} weight="duotone" />
              Öğrencinin notu
            </div>
            <p className="text-sm whitespace-pre-wrap">{app.message}</p>
          </div>
        )}

        {app.status === "PENDING" ? (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isPending}
              onClick={onAccept}
            >
              <Check size={16} className="mr-1" />
              Kabul Et & Proje Aç
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
              disabled={isPending}
              onClick={onReject}
            >
              <X size={16} className="mr-1" /> Reddet
            </Button>
          </div>
        ) : app.status === "ACCEPTED" && app.createdProjectId ? (
          <Link href={`/projects/${app.createdProjectId}`}>
            <Button size="sm" variant="outline" className="mt-1">
              Oluşturulan projeyi aç <ArrowRight size={14} className="ml-1" />
            </Button>
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  PANEL: Invitations                                                */
/* ------------------------------------------------------------------ */

function InvitationsPanel({
  query,
  items,
}: {
  query: ReturnType<typeof useQuery<any>>;
  items: any[];
}) {
  const qc = useQueryClient();
  const { filter, setFilter, counts, filtered } = useStatusFilter(items);

  const respond = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "ACCEPTED" | "REJECTED";
    }) => invitationsApi.respond(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
      qc.invalidateQueries({ queryKey: ["my-projects"] });
    },
  });

  if (query.isLoading) return <LoadingSkeletons />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">Davetlerim</h2>
          <p className="text-sm text-muted-foreground">
            Projelerine eklenmek üzere sana gönderilen davetler.
          </p>
        </div>
        <StatusFilterTabs value={filter} onChange={setFilter} counts={counts} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={EnvelopeSimple}
          title={
            filter === "ALL" ? "Henüz davet almadın" : "Bu durumda davet yok"
          }
          description="Bir proje sahibi seni davet ettiğinde burada görünecek."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((inv: any) => (
            <InvitationCard
              key={inv.id}
              inv={inv}
              onAccept={() =>
                respond.mutate({ id: inv.id, status: "ACCEPTED" })
              }
              onReject={() =>
                respond.mutate({ id: inv.id, status: "REJECTED" })
              }
              isPending={respond.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InvitationCard({
  inv,
  onAccept,
  onReject,
  isPending,
}: {
  inv: any;
  onAccept: () => void;
  onReject: () => void;
  isPending: boolean;
}) {
  const meta = statusMeta[inv.status as keyof typeof statusMeta] ?? statusMeta.PENDING;
  const StatusIcon = meta.icon;

  return (
    <Card
      className="overflow-hidden border-l-4"
      style={{ borderLeftColor: meta.borderColor }}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {getInitials(inv.inviter?.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link
                href={`/profile/${inv.inviter?.id}`}
                className="font-medium text-sm hover:text-primary"
              >
                {inv.inviter?.name}
              </Link>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <UserCircle size={12} weight="duotone" />
                {inv.inviter?.department}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge variant={meta.variant} className="gap-1">
              <StatusIcon size={12} weight="bold" />
              {meta.label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {inv.invitedRole === "PROFESSOR" ? "Akademisyen" : "Öğrenci"}{" "}
              olarak
            </Badge>
          </div>
        </div>

        <Link
          href={`/projects/${inv.project?.id}`}
          className="block rounded-lg border bg-muted/30 p-3 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
        >
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Briefcase size={14} weight="duotone" />
            Proje
          </div>
          <p className="font-medium text-sm group-hover:text-primary">
            {inv.project?.title}
          </p>
          {inv.project?.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {inv.project.description}
            </p>
          )}
          {inv.project?.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {inv.project.tags.map((t: any) => (
                <TagBadge key={t.id} name={t.name} category={t.category} />
              ))}
            </div>
          )}
        </Link>

        {inv.message && (
          <div className="rounded-lg bg-muted/40 border border-border/60 p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
              <ChatCircle size={14} weight="duotone" />
              Davet mesajı
            </div>
            <p className="text-sm whitespace-pre-wrap">{inv.message}</p>
          </div>
        )}

        {inv.status === "PENDING" && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isPending}
              onClick={onAccept}
            >
              <Check size={16} className="mr-1" /> Kabul Et
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
              disabled={isPending}
              onClick={onReject}
            >
              <X size={16} className="mr-1" /> Reddet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
