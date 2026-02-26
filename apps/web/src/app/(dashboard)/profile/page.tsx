"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TagSelector } from "@/components/tag-selector";
import { TagBadge } from "@/components/tag-badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  PencilSimple,
  Check,
  UserCircle,
  Tag,
  MagnifyingGlass,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Rocket,
  Sparkle,
  GraduationCap,
} from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ============================
// ONBOARDING WIZARD
// ============================

function ProfileOnboarding({ profile, onComplete }: { profile: any; onComplete: () => void }) {
  const { user, refreshSession } = useAuth();
  const queryClient = useQueryClient();
  const p = profile?.data;

  // Hangi adım tamamlanmamış, oradan başla
  const hasBio = !!p?.bio;
  const hasYear = !!p?.year || user?.role === "PROFESSOR";
  const hasTags = p?.tags?.length > 0;
  const profileDone = hasBio && hasYear;

  const getInitialStep = () => {
    if (!profileDone) return 0;
    if (!hasTags) return 1;
    return 2; // hepsi tamam, son adım
  };

  const [step, setStep] = useState(getInitialStep);

  // Profile form state
  const [form, setForm] = useState({
    name: p?.name || "",
    bio: p?.bio || "",
    department: p?.department || "",
    year: p?.year || null as number | null,
  });

  // Tags state
  const [selectedTags, setSelectedTags] = useState<string[]>(
    p?.tags?.map((t: any) => t.id) || []
  );

  const updateProfile = useMutation({
    mutationFn: (data: any) => profileApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      refreshSession();
      setStep(1);
    },
  });

  const updateTags = useMutation({
    mutationFn: (tagIds: string[]) => profileApi.updateTags(tagIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setStep(2);
    },
  });

  const steps = [
    { label: "Profil Bilgileri", icon: UserCircle },
    { label: "İlgi Alanları", icon: Tag },
    { label: "Hazırsın!", icon: Rocket },
  ];

  const progress = Math.round(((step + (step === 2 ? 1 : 0)) / steps.length) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
          <Sparkle size={16} weight="fill" />
          Profilini Tamamla
        </div>
        <h1 className="text-3xl font-bold">Seni Tanıyalım</h1>
        <p className="text-muted-foreground mt-1">
          Birkaç adımda profilini tamamla, daha iyi eşleşmeler al
        </p>
      </div>

      {/* Step indicator */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Adım {step + 1}/{steps.length}</span>
          <span className="font-medium">%{progress}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {i < step ? (
                <CheckCircle size={18} weight="fill" className="text-emerald-500" />
              ) : i === step ? (
                <s.icon size={18} weight="duotone" className="text-primary" />
              ) : (
                <s.icon size={18} className="text-muted-foreground/40" />
              )}
              <span className={cn(
                "text-xs font-medium",
                i < step ? "text-emerald-600" : i === step ? "text-primary" : "text-muted-foreground/40"
              )}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 0: Profil Bilgileri */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle size={22} weight="duotone" className="text-primary" />
              Profil Bilgilerin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                updateProfile.mutate({
                  name: form.name,
                  bio: form.bio || undefined,
                  department: form.department,
                  year: form.year || undefined,
                });
              }}
            >
              <div className="space-y-2">
                <Label>Ad Soyad</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Adınız Soyadınız"
                />
              </div>

              <div className="space-y-2">
                <Label>Bölüm</Label>
                <Input
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="Bilgisayar Mühendisliği"
                />
              </div>

              {user?.role === "STUDENT" && (
                <div className="space-y-2">
                  <Label>Kaçıncı Sınıfsın?</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setForm({ ...form, year: y })}
                        className={cn(
                          "flex-1 h-12 rounded-xl text-sm font-semibold border-2 transition-all",
                          form.year === y
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background border-border hover:border-primary/50"
                        )}
                      >
                        {y}. Sınıf
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  Kendinden Bahset
                  <span className="text-muted-foreground font-normal ml-1">(biyografi)</span>
                </Label>
                <Textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={4}
                  placeholder={
                    user?.role === "STUDENT"
                      ? "Hangi konularla ilgileniyorsun? Ne üzerinde çalışmak istiyorsun?"
                      : "Araştırma alanlarınız ve uzmanlıklarınız nedir?"
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Bu bilgiler eşleştirme sonuçlarını iyileştirir
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={updateProfile.isPending || !form.name || !form.department}
                  size="lg"
                >
                  {updateProfile.isPending ? "Kaydediliyor..." : "Devam Et"}
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 1: İlgi Alanları */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag size={22} weight="duotone" className="text-primary" />
              İlgi Alanlarını Seç
              <Badge variant="secondary" className="text-xs ml-2">
                {selectedTags.length}/10
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Seni en iyi tanımlayan alanları seç. Bu tag&apos;ler akademisyen eşleştirmesinde kullanılacak.
            </p>

            <TagSelector
              selected={selectedTags}
              onChange={setSelectedTags}
            />

            <Separator />

            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(0)}>
                <ArrowLeft size={16} className="mr-2" />
                Geri
              </Button>
              <Button
                onClick={() => updateTags.mutate(selectedTags)}
                disabled={updateTags.isPending || selectedTags.length === 0}
                size="lg"
              >
                {updateTags.isPending ? "Kaydediliyor..." : "Devam Et"}
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Tamamlandı */}
      {step === 2 && (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-background">
          <CardContent className="py-12 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100">
              <CheckCircle size={48} weight="fill" className="text-emerald-500" />
            </div>

            <div>
              <h2 className="text-2xl font-bold">Profilin Hazır! 🎉</h2>
              <p className="text-muted-foreground mt-2">
                Artık sana en uygun akademisyenleri bulabilirsin
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/matching">
                <Button size="lg" className="gap-2">
                  <MagnifyingGlass size={18} />
                  Akademisyen Eşleştir
                </Button>
              </Link>
              <Button variant="outline" size="lg" onClick={onComplete}>
                Profilimi Gör
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================
// NORMAL PROFILE VIEW
// ============================

function ProfileView({ profile }: { profile: any }) {
  const { user, refreshSession } = useAuth();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [editTags, setEditTags] = useState(false);
  const [form, setForm] = useState({ name: "", bio: "", department: "", year: null as number | null });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const p = profile?.data;

  const updateProfile = useMutation({
    mutationFn: (data: any) => profileApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      refreshSession();
      setEditMode(false);
    },
  });

  const updateTags = useMutation({
    mutationFn: (tagIds: string[]) => profileApi.updateTags(tagIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditTags(false);
    },
  });

  const startEdit = () => {
    setForm({
      name: p?.name || "",
      bio: p?.bio || "",
      department: p?.department || "",
      year: p?.year || null,
    });
    setEditMode(true);
  };

  const startEditTags = () => {
    setSelectedTags(p?.tags?.map((t: any) => t.id) || []);
    setEditTags(true);
  };

  const initials = (p?.name || "")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Profil tamamlanma durumu
  const isStudent = user?.role === "STUDENT";
  const hasBio = !!p?.bio;
  const hasYear = !!p?.year || !isStudent;
  const hasTags = p?.tags?.length > 0;
  const checks = isStudent ? [hasBio, hasYear, hasTags] : [hasBio, hasTags];
  const completedSteps = checks.filter(Boolean).length;
  const totalSteps = checks.length;
  const isComplete = completedSteps === totalSteps;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Profilim</h1>
        {isComplete && (
          <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 gap-1">
            <CheckCircle size={14} weight="fill" />
            Profil Tamamlandı
          </Badge>
        )}
      </div>

      {/* Eksik bilgi uyarısı */}
      {!isComplete && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex-shrink-0">
              <Progress value={(completedSteps / totalSteps) * 100} className="h-2 w-16" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Profilin %{Math.round((completedSteps / totalSteps) * 100)} tamamlandı
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {!hasBio && "Biyografi ekle. "}
                {!hasYear && isStudent && "Sınıf bilgini gir. "}
                {!hasTags && "İlgi alanlarını seç."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profil Bilgileri */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Profil Bilgileri</CardTitle>
          {!editMode && (
            <Button variant="ghost" size="sm" onClick={startEdit}>
              <PencilSimple size={16} className="mr-1" /> Düzenle
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editMode ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                updateProfile.mutate({
                  ...form,
                  year: form.year || undefined,
                });
              }}
            >
              <div className="space-y-2">
                <Label>Ad Soyad</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Bölüm</Label>
                <Input
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
              </div>
              {user?.role === "STUDENT" && (
                <div className="space-y-2">
                  <Label>Sınıf</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setForm({ ...form, year: y })}
                        className={cn(
                          "flex-1 h-10 rounded-lg text-sm font-medium border transition-all",
                          form.year === y
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:border-primary/50"
                        )}
                      >
                        {y}. Sınıf
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Biyografi</Label>
                <Textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={4}
                  placeholder="Kendinizi kısaca tanıtın..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateProfile.isPending}>
                  <Check size={16} className="mr-1" />
                  {updateProfile.isPending ? "Kaydediliyor..." : "Kaydet"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditMode(false)}>
                  İptal
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{p?.name}</h2>
                <p className="text-muted-foreground">{p?.department}</p>
                <p className="text-sm text-muted-foreground">{p?.email}</p>
                <p className="text-sm mt-1">
                  {p?.role === "PROFESSOR" ? "Akademisyen" : "Öğrenci"}
                  {p?.year ? ` • ${p.year}. sınıf` : (isStudent ? " • Sınıf belirtilmemiş" : "")}
                </p>
                {p?.bio ? (
                  <p className="text-sm text-muted-foreground mt-3">{p.bio}</p>
                ) : (
                  <p className="text-sm text-amber-600 mt-3 italic">
                    Biyografi eklenmemiş — düzenle butonuna tıkla
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tag'ler */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>İlgi Alanları</CardTitle>
          {!editTags && (
            <Button variant="ghost" size="sm" onClick={startEditTags}>
              <PencilSimple size={16} className="mr-1" /> Düzenle
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editTags ? (
            <div className="space-y-4">
              <TagSelector selected={selectedTags} onChange={setSelectedTags} />
              <Separator />
              <div className="flex gap-2">
                <Button
                  onClick={() => updateTags.mutate(selectedTags)}
                  disabled={updateTags.isPending || selectedTags.length === 0}
                >
                  <Check size={16} className="mr-1" />
                  {updateTags.isPending ? "Kaydediliyor..." : "Kaydet"}
                </Button>
                <Button variant="ghost" onClick={() => setEditTags(false)}>
                  İptal
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {p?.tags?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {p.tags.map((tag: any) => (
                    <TagBadge key={tag.id} name={tag.name} category={tag.category} />
                  ))}
                </div>
              ) : (
                <p className="text-amber-600 text-sm italic">
                  Henüz tag eklenmemiş — düzenle butonuna tıklayarak ilgi alanlarını ekle
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eşleştirmeye git CTA */}
      {isComplete && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MagnifyingGlass size={22} weight="duotone" className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Profilin hazır!</p>
              <p className="text-sm text-muted-foreground">
                Şimdi sana en uygun akademisyenleri bulabilirsin
              </p>
            </div>
            <Link href="/matching">
              <Button>
                Eşleştir
                <ArrowRight size={16} className="ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================
// MAIN PAGE
// ============================

export default function ProfilePage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.getMe(),
  });

  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  // Profil yüklendikten sonra onboarding gösterilecek mi karar ver
  useEffect(() => {
    if (profile?.data && showOnboarding === null) {
      const p = profile.data;
      const hasBio = !!p.bio;
      const hasTags = p.tags?.length > 0;
      // İlk kez gelen veya eksik bilgisi olan kullanıcılara onboarding göster
      setShowOnboarding(!hasBio || !hasTags);
    }
  }, [profile?.data, showOnboarding]);

  if (isLoading || showOnboarding === null) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <ProfileOnboarding
        profile={profile}
        onComplete={() => setShowOnboarding(false)}
      />
    );
  }

  return <ProfileView profile={profile} />;
}
