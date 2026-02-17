"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TagSelector } from "@/components/tag-selector";
import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    maxMembers: 3,
  });
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      projectsApi.create({ ...form, tagIds }),
    onSuccess: (data: any) => {
      router.push(`/projects/${data.data.id}`);
    },
    onError: (err: any) => {
      setError(err.message || "Bir hata oluştu");
    },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/projects">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft size={16} className="mr-1" /> Geri
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Proje Oluştur</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              if (tagIds.length === 0) {
                setError("En az 1 tag seçmelisiniz");
                return;
              }
              mutation.mutate();
            }}
          >
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label>Proje Başlığı</Label>
              <Input
                placeholder="Ör: Türkçe NLP ile Duygu Analizi"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                minLength={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea
                placeholder="Proje hakkında detaylı bilgi verin..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                minLength={20}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Maksimum Üye Sayısı</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={form.maxMembers}
                onChange={(e) =>
                  setForm({ ...form, maxMembers: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>İlgili Tag&apos;ler</Label>
              <TagSelector selected={tagIds} onChange={setTagIds} max={10} />
            </div>
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? "Oluşturuluyor..." : "Proje Oluştur"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
