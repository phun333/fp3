"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invitationsApi, usersApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  PaperPlaneTilt,
  X,
  MagnifyingGlass,
  GraduationCap,
  UserCircle,
  CheckCircle,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

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

type RoleFilter = "ALL" | "STUDENT" | "PROFESSOR";

export function InviteModal({
  projectId,
  project,
  onClose,
}: {
  projectId: string;
  project: any;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [justInvited, setJustInvited] = useState<Set<string>>(new Set());

  const { data: searchData, isFetching } = useQuery({
    queryKey: ["users-search", query, roleFilter],
    queryFn: () =>
      usersApi.search(
        query,
        roleFilter === "ALL" ? undefined : roleFilter,
        20
      ),
    enabled: query.length > 0,
  });

  const send = useMutation({
    mutationFn: (userId: string) =>
      invitationsApi.send(projectId, { userId, message: message || undefined }),
    onSuccess: (_d, userId) => {
      setJustInvited((s) => new Set(s).add(userId));
      qc.invalidateQueries({ queryKey: ["my-projects"] });
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["users-search"] });
      setError("");
    },
    onError: (e: any) => setError(e.message || "Davet gönderilemedi"),
  });

  const users = searchData?.data || [];
  const memberIds = new Set(project?.members?.map((m: any) => m.user?.id) || []);

  const studentCount =
    project?.members?.filter((m: any) => m.role === "STUDENT").length || 0;
  const profCount =
    project?.members?.filter((m: any) => m.role === "PROFESSOR").length || 0;
  const studentSlots = project?.studentSlots ?? 0;
  const professorSlots = project?.professorSlots ?? 0;
  const studentFull = studentCount >= studentSlots;
  const profFull = profCount >= professorSlots;

  const roles: { value: RoleFilter; label: string; hint?: string }[] = [
    { value: "ALL", label: "Tümü" },
    {
      value: "STUDENT",
      label: "Öğrenci",
      hint: `${studentCount}/${studentSlots}`,
    },
    {
      value: "PROFESSOR",
      label: "Akademisyen",
      hint: `${profCount}/${professorSlots}`,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Üye Davet Et</h2>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                Proje: <span className="font-medium">{project?.title}</span>
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={18} />
            </Button>
          </div>

          {/* Kontenjan göstergesi */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div
              className={cn(
                "rounded-lg border px-3 py-2",
                studentFull
                  ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900"
                  : "bg-muted/40"
              )}
            >
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <GraduationCap size={14} weight="duotone" />
                Öğrenci
              </div>
              <p className="font-semibold text-sm mt-0.5">
                {studentCount}/{studentSlots}
                {studentFull && (
                  <span className="ml-1 text-amber-600 font-normal">• Dolu</span>
                )}
              </p>
            </div>
            <div
              className={cn(
                "rounded-lg border px-3 py-2",
                profFull
                  ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900"
                  : "bg-muted/40"
              )}
            >
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <UserCircle size={14} weight="duotone" />
                Akademisyen
              </div>
              <p className="font-semibold text-sm mt-0.5">
                {profCount}/{professorSlots}
                {profFull && (
                  <span className="ml-1 text-amber-600 font-normal">• Dolu</span>
                )}
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Arama */}
          <div className="space-y-2">
            <div className="relative">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="İsim, e-posta veya bölüm ara..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Rol pills */}
            <div className="flex gap-1.5">
              {roles.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRoleFilter(r.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    roleFilter === r.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  )}
                >
                  {r.label}
                  {r.hint && (
                    <span
                      className={cn(
                        "tabular-nums",
                        roleFilter === r.value
                          ? "opacity-80"
                          : "opacity-60"
                      )}
                    >
                      {r.hint}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Mesaj */}
          <Textarea
            placeholder="Davet mesajı (opsiyonel)"
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          {/* Sonuçlar */}
          <div className="max-h-72 overflow-y-auto -mx-1 px-1 space-y-1">
            {query.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8 flex flex-col items-center gap-2">
                <MagnifyingGlass size={28} className="opacity-40" />
                Aramak için isim veya e-posta yazın
              </div>
            ) : isFetching ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Aranıyor...
              </p>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Sonuç bulunamadı
              </p>
            ) : (
              users.map((u: any) => {
                const isMember = memberIds.has(u.id);
                const wasInvited = justInvited.has(u.id);
                const isFull =
                  u.role === "STUDENT" ? studentFull : profFull;
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          {u.role === "PROFESSOR" ? (
                            <UserCircle size={12} weight="duotone" />
                          ) : (
                            <GraduationCap size={12} weight="duotone" />
                          )}
                          {u.role === "PROFESSOR"
                            ? "Akademisyen"
                            : "Öğrenci"}{" "}
                          • {u.department}
                        </p>
                      </div>
                    </div>
                    {isMember ? (
                      <Badge variant="secondary" className="text-xs">
                        Zaten üye
                      </Badge>
                    ) : wasInvited ? (
                      <Badge
                        variant="default"
                        className="text-xs bg-emerald-600"
                      >
                        <CheckCircle size={12} className="mr-1" />
                        Davet edildi
                      </Badge>
                    ) : isFull ? (
                      <Badge variant="outline" className="text-xs">
                        Kontenjan dolu
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => send.mutate(u.id)}
                        disabled={send.isPending}
                      >
                        <PaperPlaneTilt size={14} className="mr-1" />
                        Davet Et
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
