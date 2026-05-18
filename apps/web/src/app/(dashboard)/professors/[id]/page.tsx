"use client";

import { use, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { professorsApi, aiApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TagBadge } from "@/components/tag-badge";
import { ProjectCard } from "@/components/project-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Briefcase,
  ArrowLeft,
  Sparkle,
  ArrowsClockwise,
  Warning,
  Check,
  Target,
} from "@phosphor-icons/react";
import Link from "next/link";

type SuggestedTag = {
  tag_id: string;
  tag_name: string;
  category?: string | null;
  confidence: number;
};

const DEMO_TEXT =
  "We propose a transformer-based architecture for low-resource Turkish question answering, fine-tuning a multilingual language model on synthetic data";

const confidenceColor = (c: number) => {
  if (c >= 0.5) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (c >= 0.4) return "bg-sky-100 text-sky-700 border-sky-200";
  return "bg-muted text-muted-foreground border-border/60";
};

const confidenceLabel = (c: number) => {
  if (c >= 0.5) return "Güçlü";
  if (c >= 0.4) return "Orta";
  return "Zayıf";
};

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

  const [matchText, setMatchText] = useState(DEMO_TEXT);
  const [suggestions, setSuggestions] = useState<SuggestedTag[] | null>(null);

  const profTagIds = useMemo(
    () => new Set<string>((data?.data?.tags ?? []).map((t: any) => t.id)),
    [data]
  );

  const matchMutation = useMutation({
    mutationFn: async () => {
      const res = await aiApi.suggestTags(matchText.trim(), 8);
      return res?.data?.suggested_tags as SuggestedTag[];
    },
    onSuccess: (tags) => setSuggestions(tags ?? []),
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

  // Önerilen tag'lerden hocanın tag'leriyle örtüşenleri bul
  const matchedCount = suggestions
    ? suggestions.filter((s) => profTagIds.has(s.tag_id)).length
    : 0;
  const matchPercent =
    suggestions && suggestions.length > 0
      ? Math.round((matchedCount / suggestions.length) * 100)
      : 0;

  const errorMessage = matchMutation.isError
    ? (matchMutation.error as any)?.message ||
      "AI servisine ulaşılamadı (apps/ai-service çalışıyor mu?)"
    : null;

  const tooShort = matchText.trim().length < 20;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/professors">
        <Button variant="ghost" size="sm">
          <ArrowLeft size={16} className="mr-1" /> Geri
        </Button>
      </Link>

      {/* AI Match Test Kartı */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                <Target size={20} weight="duotone" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base">
                  Proje fikrinle eşleşmeyi test et
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fikrini yaz; AI uygun tag&apos;leri çıkarsın ve bu hocanın
                  uzmanlık alanlarıyla ne kadar örtüştüğünü görelim.
                </p>
              </div>
            </div>
            {suggestions && suggestions.length > 0 && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-semibold gap-1 px-2.5 py-1",
                  matchPercent >= 50
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : matchPercent >= 25
                    ? "bg-amber-100 text-amber-700 border-amber-200"
                    : "bg-muted text-muted-foreground border-border"
                )}
              >
                {matchedCount}/{suggestions.length} eşleşme · %{matchPercent}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={matchText}
            onChange={(e) => setMatchText(e.target.value)}
            rows={3}
            placeholder="Örn: Düşük kaynaklı Türkçe için transformer tabanlı soru cevaplama modeli..."
            className="resize-none bg-background"
          />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[11px] text-muted-foreground">
              {matchText.trim().length} karakter · en az 20 karakter
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => matchMutation.mutate()}
              disabled={tooShort || matchMutation.isPending}
            >
              {matchMutation.isPending ? (
                <>
                  <ArrowsClockwise size={14} className="mr-1 animate-spin" />
                  Analiz...
                </>
              ) : suggestions ? (
                <>
                  <ArrowsClockwise size={14} className="mr-1" />
                  Tekrar Eşleştir
                </>
              ) : (
                <>
                  <Sparkle size={14} className="mr-1" weight="fill" />
                  AI ile Eşleştir
                </>
              )}
            </Button>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
              <Warning size={14} weight="fill" className="flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {suggestions && suggestions.length === 0 && !matchMutation.isPending && (
            <p className="text-xs text-muted-foreground italic">
              Bu metin için uygun tag bulunamadı.
            </p>
          )}

          {suggestions && suggestions.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Sparkle size={11} weight="fill" className="text-primary" />
                <span>
                  AI&apos;ın çıkardığı tag&apos;ler ·{" "}
                  <span className="text-emerald-600 font-medium">yeşil</span>{" "}
                  = hocanın da uzmanı olduğu alan
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((tag) => {
                  const isMatch = profTagIds.has(tag.tag_id);
                  return (
                    <div
                      key={tag.tag_id}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                        isMatch
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-200"
                          : "bg-background text-muted-foreground border-border"
                      )}
                      title={`Skor: ${tag.confidence} (${confidenceLabel(tag.confidence)})${isMatch ? " · Hocanın uzmanlık alanı" : ""}`}
                    >
                      {isMatch && <Check size={11} weight="bold" />}
                      <span>{tag.tag_name}</span>
                      {tag.category && (
                        <span className="text-[10px] opacity-60">
                          {tag.category}
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          "ml-0.5 px-1 py-0 text-[9px] tabular-nums",
                          confidenceColor(tag.confidence)
                        )}
                      >
                        {Math.round(tag.confidence * 100)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
