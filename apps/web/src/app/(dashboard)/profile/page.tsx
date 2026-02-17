"use client";

import { useState } from "react";
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
import { PencilSimple, Check } from "@phosphor-icons/react";

export default function ProfilePage() {
  const { user, refreshSession } = useAuth();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [editTags, setEditTags] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.getMe(),
  });

  const [form, setForm] = useState({ name: "", bio: "", department: "" });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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

  const p = profile?.data;

  const startEdit = () => {
    setForm({
      name: p?.name || "",
      bio: p?.bio || "",
      department: p?.department || "",
    });
    setEditMode(true);
  };

  const startEditTags = () => {
    setSelectedTags(p?.tags?.map((t: any) => t.id) || []);
    setEditTags(true);
  };

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">Yükleniyor...</div>;
  }

  const initials = (p?.name || "")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Profilim</h1>

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
                updateProfile.mutate(form);
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
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                />
              </div>
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
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditMode(false)}
                >
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
                <p className="text-sm mt-1 capitalize">
                  {p?.role === "PROFESSOR" ? "Akademisyen" : "Öğrenci"}
                </p>
                {p?.bio && (
                  <p className="text-sm text-muted-foreground mt-3">{p.bio}</p>
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
              <TagSelector
                selected={selectedTags}
                onChange={setSelectedTags}
              />
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
                    <TagBadge
                      key={tag.id}
                      name={tag.name}
                      category={tag.category}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Henüz tag eklenmemiş. Düzenle butonuna tıklayarak ilgi
                  alanlarınızı ekleyin.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
