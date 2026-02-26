"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { savedMatchesApi, applicationsApi } from "@/lib/api";
import { TagBadge } from "@/components/tag-badge";
import { MatchScore } from "@/components/match-score";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  BookmarkSimple,
  Briefcase,
  BookOpen,
  ArrowRight,
  PaperPlaneTilt,
  Trash,
  Article,
  MagnifyingGlass,
  CheckCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function SavedMatchesPage() {
  const [filter, setFilter] = useState<"ALL" | "PROJECT" | "ARTICLE">("ALL");
  const queryClient = useQueryClient();

  const params = filter !== "ALL" ? `purpose=${filter}` : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["saved-matches", filter],
    queryFn: () => savedMatchesApi.list(params),
  });

  const savedMatches = data?.data || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookmarkSimple size={32} weight="duotone" className="text-amber-500" />
            Kayıtlı Eşleşmeler
          </h1>
          <p className="text-muted-foreground mt-1">
            Eşleştirme sonuçlarından kaydettiğin akademisyenler
          </p>
        </div>
        <Link href="/matching">
          <Button variant="outline" className="gap-2">
            <MagnifyingGlass size={16} />
            Yeni Eşleştirme
          </Button>
        </Link>
      </div>

      {/* Filtre */}
      <div className="flex gap-2">
        {[
          { value: "ALL" as const, label: "Tümü" },
          { value: "PROJECT" as const, label: "Proje", icon: Briefcase },
          { value: "ARTICLE" as const, label: "Makale", icon: Article },
        ].map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.value)}
            className="gap-1.5"
          >
            {f.icon && <f.icon size={14} />}
            {f.label}
            {filter === f.value && savedMatches.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs bg-white/20 text-inherit">
                {savedMatches.length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* İçerik */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : savedMatches.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <BookmarkSimple size={56} className="mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Henüz kayıtlı eşleşmen yok</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Eşleştirme yap ve beğendiğin akademisyenleri kaydet, sonra buradan takip et.
            </p>
            <Link href="/matching">
              <Button className="mt-4 gap-2">
                <MagnifyingGlass size={16} />
                Eşleştirme Yap
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {savedMatches.map((sm: any) => (
            <SavedMatchCard
              key={sm.id}
              savedMatch={sm}
              onRemove={() => queryClient.invalidateQueries({ queryKey: ["saved-matches"] })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SavedMatchCard({
  savedMatch,
  onRemove,
}: {
  savedMatch: any;
  onRemove: () => void;
}) {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyingToProject, setApplyingToProject] = useState<string | null>(null);
  const [applyMessage, setApplyMessage] = useState("");
  const [appliedProjects, setAppliedProjects] = useState<Set<string>>(new Set());

  const prof = savedMatch.professor;
  const initials = (prof.name || "")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const removeMutation = useMutation({
    mutationFn: () =>
      savedMatchesApi.unsave({
        professorId: prof.id,
        purpose: savedMatch.purpose,
      }),
    onSuccess: onRemove,
  });

  const applyMutation = useMutation({
    mutationFn: (projectId: string) =>
      applicationsApi.apply(projectId, { message: applyMessage || undefined }),
    onSuccess: (_data, projectId) => {
      setAppliedProjects((prev) => new Set(prev).add(projectId));
      setShowApplyModal(false);
      setApplyingToProject(null);
      setApplyMessage("");
    },
  });

  return (
    <>
      <Card className="shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/professors/${prof.id}`} className="font-semibold hover:text-primary transition-colors">
                      {prof.name}
                    </Link>
                    <Badge variant="secondary" className="text-xs">
                      {savedMatch.purpose === "PROJECT" ? "Proje" : "Makale"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{prof.department}</p>
                </div>
                {savedMatch.matchScore > 0 && (
                  <div className="flex-shrink-0 w-24">
                    <MatchScore score={savedMatch.matchScore} />
                  </div>
                )}
              </div>

              {savedMatch.description && (
                <div className="mt-2 p-2.5 bg-muted/50 rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Arama açıklaman:</p>
                  <p className="text-xs line-clamp-2">{savedMatch.description}</p>
                </div>
              )}

              {prof.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {prof.tags.slice(0, 5).map((tag: any) => (
                    <TagBadge key={tag.id} name={tag.name} category={tag.category} />
                  ))}
                  {prof.tags.length > 5 && (
                    <span className="text-xs text-muted-foreground self-center">+{prof.tags.length - 5}</span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Briefcase size={14} />
                  {prof._count?.projects || 0} proje
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen size={14} />
                  {prof._count?.publications || 0} yayın
                </span>
              </div>

              {/* Açık projeler */}
              {savedMatch.purpose === "PROJECT" && prof.projects?.length > 0 && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">📋 Açık Projeleri:</p>
                  {prof.projects.map((proj: any) => (
                    <div key={proj.id} className="flex items-center justify-between gap-2">
                      <p className="text-xs truncate flex-1">• {proj.title}</p>
                      {appliedProjects.has(proj.id) ? (
                        <span className="text-xs text-emerald-600 flex items-center gap-1 flex-shrink-0">
                          <CheckCircle size={12} weight="fill" /> Başvuruldu
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-primary"
                          onClick={() => {
                            setApplyingToProject(proj.id);
                            setShowApplyModal(true);
                          }}
                        >
                          <PaperPlaneTilt size={12} className="mr-1" />
                          Başvur
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Aksiyon butonları */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t">
            {savedMatch.purpose === "PROJECT" && prof.projects?.length > 0 && (
              <Button
                size="sm"
                className="flex-1 gap-2"
                onClick={() => {
                  setApplyingToProject(prof.projects[0].id);
                  setShowApplyModal(true);
                }}
                disabled={appliedProjects.has(prof.projects[0]?.id)}
              >
                <PaperPlaneTilt size={16} />
                {appliedProjects.has(prof.projects[0]?.id) ? "Başvuruldu" : "Projeye Başvur"}
              </Button>
            )}
            <Link href={`/professors/${prof.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full gap-2">
                Profili Gör
                <ArrowRight size={14} />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
              onClick={() => removeMutation.mutate()}
              disabled={removeMutation.isPending}
            >
              <Trash size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Başvuru modal */}
      {showApplyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowApplyModal(false)}
        >
          <Card className="w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Projeye Başvur</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {prof.projects?.find((p: any) => p.id === applyingToProject)?.title}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Başvuru Mesajı <span className="text-muted-foreground font-normal">(opsiyonel)</span>
                </label>
                <Textarea
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  rows={4}
                  placeholder="Neden bu projede yer almak istediğinizi yazın..."
                  className="mt-1.5"
                />
              </div>
              {applyMutation.isError && (
                <p className="text-sm text-destructive">
                  {(applyMutation.error as any)?.message || "Başvuru gönderilemedi"}
                </p>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowApplyModal(false)}>İptal</Button>
                <Button
                  onClick={() => applyingToProject && applyMutation.mutate(applyingToProject)}
                  disabled={applyMutation.isPending}
                  className="gap-2"
                >
                  <PaperPlaneTilt size={16} />
                  {applyMutation.isPending ? "Gönderiliyor..." : "Başvur"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
