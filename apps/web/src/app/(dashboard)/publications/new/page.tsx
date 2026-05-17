"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { publicationsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TagSelector } from "@/components/tag-selector";
import { AiTagSuggestions } from "@/components/ai-tag-suggestions";
import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";

export default function NewPublicationPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    abstract: "",
    url: "",
    year: new Date().getFullYear(),
  });
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      publicationsApi.create({
        ...form,
        url: form.url || undefined,
        abstract: form.abstract || undefined,
        tagIds,
      }),
    onSuccess: () => {
      router.push("/publications");
    },
    onError: (err: any) => {
      setError(err.message || "Bir hata oluştu");
    },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/publications">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft size={16} className="mr-1" /> Geri
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Yayın Ekle</CardTitle>
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
              <Label>Yayın Başlığı</Label>
              <Input
                placeholder="Yayın başlığı"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                minLength={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Özet (Abstract)</Label>
              <Textarea
                placeholder="Yayın özeti..."
                value={form.abstract}
                onChange={(e) => setForm({ ...form, abstract: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Yıl</Label>
                <Input
                  type="number"
                  min={1990}
                  max={2030}
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>URL (opsiyonel)</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label>İlgili Tag&apos;ler</Label>
              <AiTagSuggestions
                text={`${form.title}\n\n${form.abstract}`}
                selectedTagIds={tagIds}
                onAdd={(id) => {
                  if (!tagIds.includes(id) && tagIds.length < 10) {
                    setTagIds([...tagIds, id]);
                  }
                }}
                description="Başlık + özetten konu etiketleri öner."
                minLength={15}
              />
              <TagSelector selected={tagIds} onChange={setTagIds} max={10} />
            </div>
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? "Ekleniyor..." : "Yayın Ekle"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
