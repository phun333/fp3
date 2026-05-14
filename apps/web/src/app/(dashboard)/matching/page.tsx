"use client";

import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi, matchingApi, tagsApi, savedMatchesApi, applicationsApi } from "@/lib/api";
import { TagBadge } from "@/components/tag-badge";
import { MatchScore } from "@/components/match-score";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  BookOpen,
  MagnifyingGlass,
  Article,
  Users,
  ArrowRight,
  ArrowLeft,
  Tag,
  Star,
  Lightning,
  CheckCircle,
  Sparkle,
  Rocket,
  NotePencil,
  BookmarkSimple,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ProfessorTeamWizard } from "@/components/professor-team-wizard";

// ─── Steps ───────────────────────────────────────────
const STEPS = [
  { id: "purpose", label: "Amaç" },
  { id: "description", label: "Detay" },
  { id: "tags", label: "İlgi Alanları" },
  { id: "review", label: "Özet" },
  { id: "results", label: "Sonuçlar" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

// ─── Main ────────────────────────────────────────────
export default function MatchingPage() {
  const { user } = useAuth();

  if (user?.role === "PROFESSOR") {
    return <ProfessorTeamWizard />;
  }

  return <MatchingWizard />;
}

// ─── Wizard ──────────────────────────────────────────
function MatchingWizard() {
  const [step, setStep] = useState<StepId>("purpose");
  const [purpose, setPurpose] = useState<"ARTICLE" | "PROJECT" | null>(null);
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.getMe(),
  });

  const { data: tagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: () => tagsApi.list(),
  });

  // Profil tag'lerini varsayılan olarak doldur
  useEffect(() => {
    const p = profile?.data;
    if (p?.tags?.length > 0 && selectedTags.length === 0) {
      setSelectedTags(p.tags.map((t: any) => t.id));
    }
  }, [profile?.data]);

  const queryClient = useQueryClient();

  const matchMutation = useMutation({
    mutationFn: () =>
      matchingApi.matchProfessors({
        purpose: purpose!,
        description: description || undefined,
        tagIds: selectedTags.length > 0 ? selectedTags : undefined,
        year: profile?.data?.year || undefined,
        limit: 20,
      }),
    onSuccess: () => {
      setStep("results");
      // Saved IDs'i yenile
      queryClient.invalidateQueries({ queryKey: ["saved-match-ids"] });
    },
  });

  // Kayıtlı eşleşme ID'leri (sonuçlarda kayıtlı mı kontrolü için)
  const { data: savedIdsData } = useQuery({
    queryKey: ["saved-match-ids", purpose],
    queryFn: () => savedMatchesApi.ids(purpose || undefined),
    enabled: step === "results",
  });

  const savedProfIds = new Set(
    (savedIdsData?.data || [])
      .filter((s: any) => s.purpose === purpose)
      .map((s: any) => s.professorId)
  );

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const canGoNext = (): boolean => {
    switch (step) {
      case "purpose":
        return purpose !== null;
      case "description":
        return description.trim().length >= 10;
      case "tags":
        return selectedTags.length > 0;
      case "review":
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (step === "review") {
      matchMutation.mutate();
      return;
    }
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next.id);
  };

  const goBack = () => {
    if (step === "results") {
      setStep("review");
      return;
    }
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev.id);
  };

  const resetWizard = () => {
    setPurpose(null);
    setDescription("");
    const p = profile?.data;
    if (p?.tags?.length > 0) {
      setSelectedTags(p.tags.map((t: any) => t.id));
    } else {
      setSelectedTags([]);
    }
    setStep("purpose");
  };

  const toggleTag = (id: string) => {
    if (selectedTags.includes(id)) {
      setSelectedTags(selectedTags.filter((s) => s !== id));
    } else if (selectedTags.length < 10) {
      setSelectedTags([...selectedTags, id]);
    }
  };

  const grouped = tagsData?.data?.grouped || {};
  const matchedProfessors = matchMutation.data?.data || [];

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="space-y-4 w-full max-w-lg">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Stepper — sonuç adımında gizle */}
      {step !== "results" && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.filter((s) => s.id !== "results").map((s, i) => {
              const currentIdx = Math.min(stepIndex, 3);
              const isActive = i === currentIdx;
              const isDone = i < currentIdx;
              return (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                        isDone
                          ? "bg-primary text-primary-foreground"
                          : isActive
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isDone ? <CheckCircle size={18} weight="bold" /> : i + 1}
                    </div>
                    <span
                      className={cn(
                        "text-xs mt-1.5 font-medium",
                        isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < 3 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 mx-3 rounded-full transition-colors",
                        i < currentIdx ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Step 1: Amaç ──────────────────────── */}
      {step === "purpose" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
              <Rocket size={32} weight="duotone" className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Ne yapmak istiyorsun?</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Sana en uygun akademisyeni bulmamız için önce amacını belirlememiz gerekiyor
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <button
              onClick={() => setPurpose("PROJECT")}
              className={cn(
                "group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all text-left",
                purpose === "PROJECT"
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                  : "border-border hover:border-primary/40 hover:shadow-sm"
              )}
            >
              <div
                className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center transition-colors",
                  purpose === "PROJECT" ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}
              >
                <Briefcase size={28} weight={purpose === "PROJECT" ? "fill" : "duotone"} />
              </div>
              <div className="text-center">
                <h3 className={cn("font-semibold text-lg", purpose === "PROJECT" ? "text-primary" : "text-foreground")}>
                  Proje
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Bir akademisyenle birlikte proje geliştirmek istiyorum
                </p>
              </div>
              {purpose === "PROJECT" && (
                <CheckCircle size={24} weight="fill" className="text-primary" />
              )}
            </button>

            <button
              onClick={() => setPurpose("ARTICLE")}
              className={cn(
                "group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all text-left",
                purpose === "ARTICLE"
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                  : "border-border hover:border-primary/40 hover:shadow-sm"
              )}
            >
              <div
                className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center transition-colors",
                  purpose === "ARTICLE" ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}
              >
                <Article size={28} weight={purpose === "ARTICLE" ? "fill" : "duotone"} />
              </div>
              <div className="text-center">
                <h3 className={cn("font-semibold text-lg", purpose === "ARTICLE" ? "text-primary" : "text-foreground")}>
                  Makale
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Bir akademisyenle birlikte makale/yayın yazmak istiyorum
                </p>
              </div>
              {purpose === "ARTICLE" && (
                <CheckCircle size={24} weight="fill" className="text-primary" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2: Detay ─────────────────────── */}
      {step === "description" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
              <NotePencil size={32} weight="duotone" className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold">
              {purpose === "PROJECT" ? "Projen hakkında bilgi ver" : "Makalen hakkında bilgi ver"}
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Ne üzerine çalışmak istediğini anlat. Ne kadar detay verirsen eşleştirme o kadar doğru olur.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <Card className="shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  {purpose === "PROJECT" ? (
                    <><Briefcase size={16} className="text-primary" /> Proje Açıklaması</>
                  ) : (
                    <><Article size={16} className="text-primary" /> Makale Açıklaması</>
                  )}
                  <span className="text-destructive">*</span>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder={
                    purpose === "PROJECT"
                      ? "Örn: IoT sensörleri kullanarak akıllı sera yönetim sistemi geliştirmek istiyorum. Sıcaklık, nem ve toprak nemi verilerini gerçek zamanlı izleyip otomatik sulama yapabilecek bir sistem planlıyorum..."
                      : "Örn: Derin öğrenme yöntemlerini kullanarak tıbbi görüntülerde tümör tespiti üzerine bir araştırma makalesi yazmak istiyorum. Transfer learning ve veri artırma tekniklerini karşılaştırmayı planlıyorum..."
                  }
                  className="text-sm min-h-[140px] resize-none"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {description.trim().length < 10 ? (
                      <span className="text-destructive">En az 10 karakter ({description.trim().length}/10)</span>
                    ) : (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle size={12} weight="fill" /> Harika, yeterli detay var
                      </span>
                    )}
                  </p>
                  <span className="text-xs text-muted-foreground">{description.length}/2000</span>
                </div>

                {/* İpuçları */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Sparkle size={14} weight="fill" className="text-amber-500" />
                    İpuçları
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Hangi teknolojileri/yöntemleri kullanmak istediğini belirt</li>
                    <li>• Problemin ne olduğunu ve çözüm yaklaşımını açıkla</li>
                    <li>• Varsa hedef kitleyi veya uygulama alanını yaz</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── Step 3: Tag Seçimi ────────────────── */}
      {step === "tags" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
              <Tag size={32} weight="duotone" className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold">İlgi alanlarını seç</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Çalışmak istediğin konulara uygun etiketleri seç. Bu etiketler akademisyenlerle eşleşmeni sağlar.
            </p>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              {/* Seçili tag'ler */}
              {selectedTags.length > 0 && (
                <div className="mb-5 pb-4 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      Seçili Etiketler
                      <Badge variant="secondary" className="text-xs">{selectedTags.length}/10</Badge>
                    </p>
                    <button onClick={() => setSelectedTags([])} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                      Temizle
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTags.map((id) => {
                      const allTags = Object.values(grouped).flat() as any[];
                      const tag = allTags.find((t: any) => t.id === id);
                      if (!tag) return null;
                      return (
                        <button key={id} onClick={() => toggleTag(id)} className="group">
                          <TagBadge name={tag.name} category={tag.category} className="group-hover:line-through group-hover:opacity-60 transition-all" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Kategorilere göre tag'ler */}
              <div className="space-y-5">
                {Object.entries(grouped).map(([category, tags]) => (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-foreground mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {(tags as any[]).map((tag: any) => {
                        const isSelected = selectedTags.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                            )}
                          >
                            {isSelected && <CheckCircle size={12} weight="fill" className="inline mr-1 -mt-0.5" />}
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {selectedTags.length === 0 && (
                <p className="text-sm text-destructive mt-4 text-center">En az 1 etiket seçmelisiniz</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Step 4: Özet ──────────────────────── */}
      {step === "review" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
              <MagnifyingGlass size={32} weight="duotone" className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Her şey hazır!</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Tercihlerini gözden geçir, eşleştirmeyi başlat
            </p>
          </div>

          <Card className="shadow-sm max-w-lg mx-auto">
            <CardContent className="p-6 space-y-5">
              {/* Amaç */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {purpose === "PROJECT" ? (
                    <Briefcase size={20} weight="duotone" className="text-primary" />
                  ) : (
                    <Article size={20} weight="duotone" className="text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Amaç</p>
                  <p className="font-semibold">{purpose === "PROJECT" ? "Proje Geliştirme" : "Makale Yazımı"}</p>
                </div>
                <button onClick={() => setStep("purpose")} className="text-xs text-primary hover:underline flex-shrink-0">Düzenle</button>
              </div>

              <div className="border-t" />

              {/* Açıklama */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <NotePencil size={20} weight="duotone" className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Açıklama</p>
                  <p className="text-sm mt-0.5 line-clamp-3">{description}</p>
                </div>
                <button onClick={() => setStep("description")} className="text-xs text-primary hover:underline flex-shrink-0">Düzenle</button>
              </div>

              <div className="border-t" />

              {/* Tag'ler */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Tag size={20} weight="duotone" className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1.5">İlgi Alanları ({selectedTags.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedTags.map((id) => {
                      const allTags = Object.values(grouped).flat() as any[];
                      const tag = allTags.find((t: any) => t.id === id);
                      if (!tag) return null;
                      return <TagBadge key={id} name={tag.name} category={tag.category} />;
                    })}
                  </div>
                </div>
                <button onClick={() => setStep("tags")} className="text-xs text-primary hover:underline flex-shrink-0">Düzenle</button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Step 5: Sonuçlar ──────────────────── */}
      {step === "results" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Star size={28} weight="duotone" className="text-amber-500" />
                Eşleşen Akademisyenler
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {purpose === "PROJECT" ? "Proje" : "Makale"} tercihlerin doğrultusunda {matchedProfessors.length} akademisyen bulundu
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={resetWizard}>
              <MagnifyingGlass size={16} className="mr-1.5" />
              Yeni Arama
            </Button>
          </div>

          {matchedProfessors.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="py-16 text-center">
                <Users size={56} className="mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-semibold mb-1">Sonuç bulunamadı</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Seçtiğiniz ilgi alanlarına uygun akademisyen bulunamadı. Farklı etiketlerle tekrar deneyin.
                </p>
                <Button variant="outline" className="mt-4" onClick={resetWizard}>
                  Tekrar Dene
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {matchedProfessors.map((prof: any, index: number) => (
                <ProfessorMatchCard
                  key={prof.id}
                  professor={prof}
                  rank={index + 1}
                  purpose={purpose!}
                  description={description}
                  isSaved={savedProfIds.has(prof.id)}
                  onSavedChange={() => queryClient.invalidateQueries({ queryKey: ["saved-match-ids"] })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Navigation Buttons ───────────────── */}
      {step !== "results" && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <div>
            {stepIndex > 0 && (
              <Button variant="ghost" onClick={goBack} className="gap-2">
                <ArrowLeft size={16} />
                Geri
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {stepIndex + 1} / {STEPS.length - 1}
            </span>
            <Button
              onClick={goNext}
              disabled={!canGoNext() || matchMutation.isPending}
              className="gap-2 min-w-[160px]"
              size="lg"
            >
              {step === "review" ? (
                matchMutation.isPending ? (
                  <><span className="animate-spin">⏳</span> Eşleştiriliyor...</>
                ) : (
                  <><Sparkle size={18} weight="fill" /> Eşleştir</>
                )
              ) : (
                <>Devam Et <ArrowRight size={16} /></>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Professor Match Card ────────────────────────────
function ProfessorMatchCard({
  professor,
  rank,
  purpose,
  description,
  isSaved,
  onSavedChange,
}: {
  professor: any;
  rank: number;
  purpose: "ARTICLE" | "PROJECT";
  description: string;
  isSaved: boolean;
  onSavedChange: () => void;
}) {
  const [applyingToProject, setApplyingToProject] = useState<string | null>(null);
  const [applyMessage, setApplyMessage] = useState("");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [appliedProjects, setAppliedProjects] = useState<Set<string>>(new Set());
  const [saveSuccess, setSaveSuccess] = useState(false);

  const initials = (professor.name || "")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const rankBg =
    rank === 1
      ? "bg-amber-500 text-white"
      : rank === 2
        ? "bg-gray-400 text-white"
        : rank === 3
          ? "bg-amber-700 text-white"
          : "bg-muted text-muted-foreground";

  // Kaydet mutation
  const saveMutation = useMutation({
    mutationFn: () =>
      savedMatchesApi.save({
        professorId: professor.id,
        purpose,
        description,
        matchScore: professor.matchScore,
      }),
    onSuccess: () => {
      onSavedChange();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    },
  });

  // Kayıt sil mutation
  const unsaveMutation = useMutation({
    mutationFn: () =>
      savedMatchesApi.unsave({
        professorId: professor.id,
        purpose,
      }),
    onSuccess: () => onSavedChange(),
  });

  // Projeye başvur mutation
  const applyMutation = useMutation({
    mutationFn: (projectId: string) =>
      applicationsApi.apply(projectId, {
        message: applyMessage || undefined,
      }),
    onSuccess: (_data, projectId) => {
      setAppliedProjects((prev) => new Set(prev).add(projectId));
      setShowApplyModal(false);
      setApplyingToProject(null);
      setApplyMessage("");
    },
  });

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaved) {
      unsaveMutation.mutate();
    } else {
      saveMutation.mutate();
    }
  };

  const handleApplyClick = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setApplyingToProject(projectId);
    setShowApplyModal(true);
  };

  const handleApplySubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (applyingToProject) {
      applyMutation.mutate(applyingToProject);
    }
  };

  return (
    <div className="relative">
      <Card className="shadow-sm hover:shadow-md transition-all hover:border-primary/30">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                rankBg
              )}
            >
              {rank}
            </div>
            <Link href={`/professors/${professor.id}`} className="flex items-start gap-4 flex-1 min-w-0">
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{professor.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {professor.department}
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-28">
                    <MatchScore score={professor.matchScore} />
                  </div>
                </div>

                {professor.bio && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {professor.bio}
                  </p>
                )}

                {professor.commonTags?.length > 0 && (
                  <div className="mt-2.5">
                    <p className="text-xs text-muted-foreground mb-1">
                      Ortak İlgi Alanları:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {professor.commonTags.map((tag: any) => (
                        <TagBadge
                          key={tag.id}
                          name={tag.name}
                          category={tag.category}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-2.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Briefcase size={14} />
                    {professor._count?.projects || 0} proje
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={14} />
                    {professor._count?.publications || 0} yayın
                  </span>
                  {professor.commonTagCount > 0 && (
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <Lightning size={14} weight="fill" />
                      {professor.commonTagCount} ortak tag
                    </span>
                  )}
                </div>

                {/* Açık projeler — başvuru butonu ile */}
                {purpose === "PROJECT" &&
                  professor.relevantProjects?.length > 0 && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        📋 Açık Projeleri:
                      </p>
                      {professor.relevantProjects
                        .slice(0, 3)
                        .map((proj: any) => (
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
                                className="h-6 px-2 text-xs text-primary hover:text-primary flex-shrink-0"
                                onClick={(e) => handleApplyClick(e, proj.id)}
                              >
                                <PaperPlaneTilt size={12} className="mr-1" />
                                Başvur
                              </Button>
                            )}
                          </div>
                        ))}
                    </div>
                  )}

                {purpose === "ARTICLE" &&
                  professor.relevantPublications?.length > 0 && (
                    <div className="mt-3 p-2.5 bg-muted/50 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">
                        📚 Yayınları:
                      </p>
                      <div className="space-y-1">
                        {professor.relevantPublications
                          .slice(0, 3)
                          .map((pub: any) => (
                            <p key={pub.id} className="text-xs truncate">
                              • {pub.title} {pub.year ? `(${pub.year})` : ""}
                            </p>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            </Link>
          </div>

          {/* Aksiyon butonları */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t">
            <Button
              variant={isSaved ? "secondary" : "outline"}
              size="sm"
              className={cn(
                "flex-1 gap-2",
                isSaved && "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
                saveSuccess && "bg-emerald-50 text-emerald-700 border-emerald-200"
              )}
              onClick={handleSaveToggle}
              disabled={saveMutation.isPending || unsaveMutation.isPending}
            >
              <BookmarkSimple
                size={16}
                weight={isSaved ? "fill" : "regular"}
                className={isSaved ? "text-amber-500" : ""}
              />
              {saveSuccess ? "Kaydedildi!" : isSaved ? "Kayıtlı" : "Kaydet"}
            </Button>

            {purpose === "PROJECT" && professor.relevantProjects?.length > 0 && (
              <Button
                size="sm"
                className="flex-1 gap-2"
                onClick={(e) => handleApplyClick(e, professor.relevantProjects[0].id)}
                disabled={appliedProjects.has(professor.relevantProjects[0]?.id)}
              >
                <PaperPlaneTilt size={16} />
                {appliedProjects.has(professor.relevantProjects[0]?.id) ? "Başvuruldu" : "Projeye Başvur"}
              </Button>
            )}

            <Link href={`/professors/${professor.id}`} className="flex-shrink-0">
              <Button variant="ghost" size="sm">
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Başvuru modal */}
      {showApplyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { e.stopPropagation(); setShowApplyModal(false); }}
        >
          <Card
            className="w-full max-w-md mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Projeye Başvur</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {professor.relevantProjects?.find((p: any) => p.id === applyingToProject)?.title}
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
                <Button variant="outline" onClick={() => setShowApplyModal(false)}>
                  İptal
                </Button>
                <Button
                  onClick={handleApplySubmit}
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
    </div>
  );
}
