"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { matchingApi, professorsApi, profileApi, tagsApi, teamIdeasApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { MatchScore } from "@/components/match-score";
import { TagBadge } from "@/components/tag-badge";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ClipboardText,
  GraduationCap,
  Handshake,
  LightbulbFilament,
  PaperPlaneTilt,
  Sparkle,
  Student,
  UsersThree,
} from "@phosphor-icons/react";

const STEPS = [
  { id: "idea", label: "Fikir" },
  { id: "needs", label: "Kontenjan" },
  { id: "tags", label: "Alan" },
  { id: "professors", label: "Hoca" },
  { id: "results", label: "Ekip" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

type Candidate = {
  id: string;
  name: string;
  email?: string;
  department: string;
  bio?: string | null;
  role?: "PROFESSOR" | "STUDENT";
  year?: number | null;
  tags?: { id: string; name: string; category?: string | null }[];
  commonTags?: { id: string; name: string; category?: string | null }[];
  matchScore?: number;
  _count?: { projects?: number; publications?: number; applications?: number };
};

export function ProfessorTeamWizard() {
  const { user } = useAuth();
  const [step, setStep] = useState<StepId>("idea");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [professorSlots, setProfessorSlots] = useState(2);
  const [studentSlots, setStudentSlots] = useState(10);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProfessorIds, setSelectedProfessorIds] = useState<string[]>([]);
  const [handoffNotes, setHandoffNotes] = useState<Record<string, string>>({});
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [createdIdeaId, setCreatedIdeaId] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.getMe(),
  });

  const { data: tagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: () => tagsApi.list(),
  });

  useEffect(() => {
    const tags = profile?.data?.tags || [];
    if (tags.length > 0 && selectedTags.length === 0) {
      setSelectedTags(tags.map((t: any) => t.id));
    }
  }, [profile?.data]);

  const professorParams = useMemo(() => {
    const params = new URLSearchParams({ limit: "50" });
    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
    return params.toString();
  }, [selectedTags]);

  const { data: professorsData, isLoading: professorsLoading } = useQuery({
    queryKey: ["team-professor-candidates", professorParams],
    queryFn: () => professorsApi.list(professorParams),
    enabled: step === "professors" && selectedTags.length > 0,
  });

  const matchMutation = useMutation({
    mutationFn: () =>
      matchingApi.matchTeam({
        title,
        description,
        professorSlots,
        studentSlots,
        tagIds: selectedTags,
        selectedProfessorIds,
        limit: 30,
      }),
    onSuccess: () => setStep("results"),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const results = matchMutation.data?.data;
      const selectedProfessors = [
        ...(results?.selectedProfessors || []),
        ...(results?.recommendedProfessors || []).filter((p: Candidate) => selectedProfessorIds.includes(p.id)),
      ];
      const students = (results?.recommendedStudents || []).filter((s: Candidate) =>
        selectedStudentIds.includes(s.id)
      );

      return teamIdeasApi.create({
        title,
        description,
        professorSlots,
        studentSlots,
        tagIds: selectedTags,
        selectedProfessorIds,
        professorInvites: selectedProfessors.map((p: Candidate) => ({
          userId: p.id,
          handoffNote: handoffNotes[p.id] || "Bu fikir için akademisyen ekip arkadaşı olarak davet edildiniz.",
          matchScore: p.matchScore || 0,
        })),
        studentInvites: students.map((s: Candidate) => ({
          userId: s.id,
          handoffNote: "Bu ekip fikrine öğrenci ekip arkadaşı olarak davet edildiniz.",
          matchScore: s.matchScore || 0,
        })),
      });
    },
    onSuccess: (data: any) => {
      setCreatedIdeaId(data?.data?.id || "created");
      setCreatedProjectId(data?.data?.projectId || data?.data?.project?.id || null);
      // İlgili list'lerin cache'ini tazele
      queryClient.invalidateQueries({ queryKey: ["my-projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["team-ideas"] });
    },
  });

  const groupedTags = tagsData?.data?.grouped || {};
  const professorCandidates = (professorsData?.data || []).filter((p: Candidate) => p.id !== user?.id);
  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const collaboratorLimit = Math.max(professorSlots - 1, 0);

  const canGoNext = () => {
    if (step === "idea") return title.trim().length >= 5 && description.trim().length >= 20;
    if (step === "needs") return professorSlots >= 1 && studentSlots >= 1;
    if (step === "tags") return selectedTags.length > 0;
    if (step === "professors") return selectedProfessorIds.length <= collaboratorLimit;
    return false;
  };

  const goNext = () => {
    if (step === "professors") {
      matchMutation.mutate();
      return;
    }
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next.id);
  };

  const goBack = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev.id);
  };

  const toggleTag = (id: string) => {
    if (selectedTags.includes(id)) setSelectedTags(selectedTags.filter((tagId) => tagId !== id));
    else if (selectedTags.length < 10) setSelectedTags([...selectedTags, id]);
  };

  const toggleProfessor = (candidate: Candidate) => {
    if (selectedProfessorIds.includes(candidate.id)) {
      setSelectedProfessorIds(selectedProfessorIds.filter((id) => id !== candidate.id));
      return;
    }
    if (selectedProfessorIds.length < collaboratorLimit) {
      setSelectedProfessorIds([...selectedProfessorIds, candidate.id]);
      setHandoffNotes((notes) => ({
        ...notes,
        [candidate.id]: `${candidate.name} hocam, fikrin ${candidate.department} tarafında yürütülmesi ve ilgili iş paketinin sahiplenilmesi için sizi ekibe davet etmek istiyorum.`,
      }));
    }
  };

  const toggleStudent = (candidate: Candidate) => {
    if (selectedStudentIds.includes(candidate.id)) {
      setSelectedStudentIds(selectedStudentIds.filter((id) => id !== candidate.id));
    } else if (selectedStudentIds.length < studentSlots) {
      setSelectedStudentIds([...selectedStudentIds, candidate.id]);
    }
  };

  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-7">
      <section className="relative overflow-hidden rounded-3xl border bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,.18),transparent_36%),linear-gradient(135deg,rgba(15,23,42,.96),rgba(30,41,59,.92))] p-7 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-white/10" />
        <div className="absolute right-12 bottom-5 h-20 w-20 rounded-full bg-white/5 blur-xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge className="mb-4 bg-white/10 text-white hover:bg-white/10">Akademisyen onboarding</Badge>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Fikirden ekibe: hoca + öğrenci kurucu paneli</h1>
            <p className="mt-3 max-w-2xl text-white/70">
              Fikrini yaz, kaç akademisyen ve kaç öğrenci gerektiğini belirt. Sistem uygun hocaları ve öğrencileri tag eşleşmesine göre önerir; seçtiğin hocalara iş paketi notu bırakabilirsin.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Metric label="Toplam hoca" value={professorSlots} />
            <Metric label="Öğrenci" value={studentSlots} />
          </div>
        </div>
      </section>

      {step !== "results" && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {STEPS.slice(0, 4).map((s, index) => {
            const active = index === stepIndex;
            const done = index < stepIndex;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-10 min-w-10 items-center justify-center rounded-full border text-sm font-bold transition-colors",
                    done || active ? "border-primary bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {done ? <CheckCircle size={18} weight="fill" /> : index + 1}
                </div>
                <span className={cn("text-sm font-medium", active ? "text-primary" : "text-muted-foreground")}>{s.label}</span>
                {index < 3 && <div className="h-px w-10 bg-border" />}
              </div>
            );
          })}
        </div>
      )}

      <Card className="border-border/80 shadow-sm">
        <CardContent className="p-6 md:p-8">
          {step === "idea" && (
            <div className="space-y-5">
              <StepTitle icon={<LightbulbFilament size={28} weight="duotone" />} title="Kafandaki fikri tarif et" description="Bu metin hem hoca hem öğrenci eşleşmesinde bağlam olarak kullanılacak." />
              <div className="grid gap-4">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Türkçe akademik metinler için açık kaynak LLM değerlendirme platformu" />
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={7} placeholder="Fikrin amacı, beklenen çıktı, hocalardan beklenen roller ve öğrenci iş paketlerini yaz..." />
                <p className="text-xs text-muted-foreground">Minimum: başlık 5, açıklama 20 karakter.</p>
              </div>
            </div>
          )}

          {step === "needs" && (
            <div className="space-y-6">
              <StepTitle icon={<UsersThree size={28} weight="duotone" />} title="Ekip büyüklüğünü belirle" description="Örneğin 2 akademisyen + 10 öğrenci gibi karma ekip ihtiyacını burada netleştir." />
              <div className="grid gap-4 md:grid-cols-2">
                <Counter label="Toplam akademisyen (sen dahil)" value={professorSlots} min={1} max={10} onChange={setProfessorSlots} icon={<GraduationCap size={24} />} />
                <Counter label="Gereken öğrenci" value={studentSlots} min={1} max={50} onChange={setStudentSlots} icon={<Student size={24} />} />
              </div>
            </div>
          )}

          {step === "tags" && (
            <div className="space-y-6">
              <StepTitle icon={<Sparkle size={28} weight="duotone" />} title="Eşleşme alanlarını seç" description="En fazla 10 tag seç. Profilindeki tag'ler otomatik gelir; fikre göre düzenleyebilirsin." />
              <div className="space-y-5 max-h-[520px] overflow-y-auto pr-2">
                {Object.entries(groupedTags).map(([category, tags]: [string, any]) => (
                  <div key={category}>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{category}</h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag: any) => {
                        const selected = selectedTags.includes(tag.id);
                        return (
                          <button key={tag.id} onClick={() => toggleTag(tag.id)} className={cn("rounded-full border px-3 py-1.5 text-sm transition-all", selected ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border hover:border-primary/50 hover:bg-primary/5")}>
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === "professors" && (
            <div className="space-y-6">
              <StepTitle icon={<Handshake size={28} weight="duotone" />} title="Hocaları seç ve işi pasla" description={collaboratorLimit > 0 ? `Sen ekipte varsın; en fazla ${collaboratorLimit} akademisyen daha seç. Seçtiklerine ayrı iş paketi/davet notu yazabilirsin.` : "Bu fikir için ek akademisyen seçmeden öğrenci ekibine geçebilirsin."} />
              {professorsLoading ? (
                <div className="grid gap-3 md:grid-cols-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {professorCandidates.map((prof: Candidate) => (
                    <CandidateCard key={prof.id} candidate={{ ...prof, role: "PROFESSOR" }} selected={selectedProfessorIds.includes(prof.id)} onToggle={() => toggleProfessor(prof)} />
                  ))}
                  {professorCandidates.length === 0 && <p className="col-span-2 py-8 text-center text-muted-foreground">Seçtiğin tag'lerde uygun akademisyen bulunamadı.</p>}
                </div>
              )}

              {selectedProfessorIds.length > 0 && (
                <div className="space-y-3 rounded-2xl bg-muted/40 p-4">
                  <h3 className="font-semibold">İş paketi notları</h3>
                  {selectedProfessorIds.map((id) => {
                    const prof = professorCandidates.find((p: Candidate) => p.id === id);
                    return (
                      <div key={id}>
                        <p className="mb-1 text-sm font-medium">{prof?.name || "Seçili akademisyen"}</p>
                        <Textarea value={handoffNotes[id] || ""} onChange={(e) => setHandoffNotes({ ...handoffNotes, [id]: e.target.value })} rows={2} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === "results" && <ResultsPanel data={matchMutation.data?.data} selectedProfessorIds={selectedProfessorIds} selectedStudentIds={selectedStudentIds} studentSlots={studentSlots} onToggleStudent={toggleStudent} onCreate={() => createMutation.mutate()} creating={createMutation.isPending} createdIdeaId={createdIdeaId} createdProjectId={createdProjectId} />}
        </CardContent>
      </Card>

      {step !== "results" && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={goBack} disabled={stepIndex === 0}>
            <ArrowLeft size={16} /> Geri
          </Button>
          <Button onClick={goNext} disabled={!canGoNext() || matchMutation.isPending}>
            {step === "professors" ? (matchMutation.isPending ? "Ekip aranıyor..." : "Eşleştir") : "Devam"}
            <ArrowRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center backdrop-blur">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-white/65">{label}</div>
    </div>
  );
}

function StepTitle({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</div>
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function Counter({ label, value, min, max, onChange, icon }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-4 flex items-center gap-3 text-primary">
        {icon}
        <span className="font-semibold text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => onChange(Math.max(min, value - 1))}>-</Button>
        <Input className="text-center text-lg font-bold" type="number" min={min} max={max} value={value} onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value))))} />
        <Button variant="outline" size="icon" onClick={() => onChange(Math.min(max, value + 1))}>+</Button>
      </div>
    </div>
  );
}

function CandidateCard({ candidate, selected, onToggle }: { candidate: Candidate; selected: boolean; onToggle: () => void }) {
  const initials = candidate.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <button onClick={onToggle} className={cn("rounded-2xl border p-4 text-left transition-all hover:border-primary/50 hover:shadow-sm", selected ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/10" : "border-border bg-card") }>
      <div className="flex gap-3">
        <Avatar className="h-11 w-11"><AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback></Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold leading-tight">{candidate.name}</h3>
              <p className="text-sm text-muted-foreground">{candidate.department}</p>
            </div>
            {selected && <CheckCircle size={22} weight="fill" className="shrink-0 text-primary" />}
          </div>
          {candidate.matchScore !== undefined && <div className="mt-2"><MatchScore score={candidate.matchScore} /></div>}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(candidate.commonTags?.length ? candidate.commonTags : candidate.tags || []).slice(0, 4).map((tag) => <TagBadge key={tag.id} name={tag.name} category={tag.category} />)}
          </div>
        </div>
      </div>
    </button>
  );
}

function ResultsPanel({ data, selectedStudentIds, studentSlots, onToggleStudent, onCreate, creating, createdIdeaId, createdProjectId }: { data: any; selectedProfessorIds: string[]; selectedStudentIds: string[]; studentSlots: number; onToggleStudent: (candidate: Candidate) => void; onCreate: () => void; creating: boolean; createdIdeaId: string | null; createdProjectId: string | null }) {
  const professors: Candidate[] = [...(data?.selectedProfessors || []), ...(data?.recommendedProfessors || [])];
  const students: Candidate[] = data?.recommendedStudents || [];

  return (
    <div className="space-y-7">
      <StepTitle icon={<ClipboardText size={28} weight="duotone" />} title="Ekip taslağı hazır" description="Hocalar seçildi; şimdi önerilen öğrencilerden kontenjan kadarını ekibe dahil edebilirsin." />
      {createdIdeaId && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 space-y-3">
          <div>
            <p className="font-semibold flex items-center gap-2">
              <CheckCircle size={18} weight="fill" />
              Proje oluşturuldu ve davetler gönderildi
            </p>
            <p className="text-sm mt-1">
              Proje artık <strong>Projelerim</strong>'de görünüyor. Davet edilen herkes
              kendi <strong>Gelen Kutusu → Davetlerim</strong> sekmesinden cevap verebilir.
              Sen de proje detayından davetlerin durumunu takip edebilirsin.
            </p>
          </div>
          {createdProjectId && (
            <div className="flex flex-wrap gap-2">
              <Link href={`/projects/${createdProjectId}`}>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Projeyi Aç <ArrowRight size={14} className="ml-1" />
                </Button>
              </Link>
              <Link href="/my-projects">
                <Button size="sm" variant="outline" className="bg-white">
                  Projelerim
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
      <div>
        <h3 className="mb-3 font-semibold">Akademisyen eşleşmeleri</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {professors.slice(0, 6).map((prof) => <CandidateCard key={prof.id} candidate={prof} selected onToggle={() => {}} />)}
        </div>
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Önerilen öğrenciler</h3>
          <Badge variant="secondary">{selectedStudentIds.length}/{studentSlots} seçildi</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {students.map((student) => <CandidateCard key={student.id} candidate={student} selected={selectedStudentIds.includes(student.id)} onToggle={() => onToggleStudent(student)} />)}
          {students.length === 0 && <p className="col-span-2 py-8 text-center text-muted-foreground">Bu tag'lerde önerilecek öğrenci yok. Öğrenciler kayıt olup tag ekledikçe burada görünecek.</p>}
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={onCreate} disabled={creating || !!createdIdeaId}>
          <PaperPlaneTilt size={16} /> {creating ? "Kaydediliyor..." : "Ekip fikrini kaydet ve davetleri oluştur"}
        </Button>
      </div>
    </div>
  );
}
