"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { aiApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Sparkle,
  Plus,
  Check,
  Warning,
  ArrowsClockwise,
} from "@phosphor-icons/react";

type SuggestedTag = {
  tag_id: string;
  tag_name: string;
  category?: string | null;
  confidence: number;
};

interface AiTagSuggestionsProps {
  /** Suggestion'ları üretmek için kullanılacak kaynak metin (description / abstract / bio + extras) */
  text: string;
  /** Şu an seçili tag id'leri — bu listede olanlar "Eklendi" olarak gösterilir */
  selectedTagIds: string[];
  /** Bir tag eklenmek istendiğinde çağrılır */
  onAdd: (tagId: string) => void;
  /** Minimum metin uzunluğu (default 20). Altındaysa buton disabled */
  minLength?: number;
  /** Üretilecek en yüksek skorlu tag sayısı (default 6) */
  topN?: number;
  /** Kart başlığı altında gösterilecek alt yazı */
  description?: string;
  className?: string;
}

const confidenceColor = (c: number) => {
  if (c >= 0.7) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (c >= 0.55) return "bg-sky-100 text-sky-700 border-sky-200";
  return "bg-muted text-muted-foreground border-border/60";
};

const confidenceLabel = (c: number) => {
  if (c >= 0.7) return "Güçlü";
  if (c >= 0.55) return "Orta";
  return "Zayıf";
};

export function AiTagSuggestions({
  text,
  selectedTagIds,
  onAdd,
  minLength = 20,
  topN = 6,
  description = "Metinden çıkarılan anahtar kelimelere göre tag önerileri.",
  className,
}: AiTagSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestedTag[] | null>(null);

  const trimmed = text.trim();
  const tooShort = trimmed.length < minLength;

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await aiApi.suggestTags(trimmed, topN);
      return res?.data?.suggested_tags as SuggestedTag[];
    },
    onSuccess: (tags) => {
      setSuggestions(tags ?? []);
    },
  });

  const errorMessage = mutation.isError
    ? (mutation.error as any)?.message ||
      "AI servisine ulaşılamadı (apps/ai-service çalışıyor mu?)"
    : null;

  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3.5",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-md bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
            <Sparkle size={14} weight="fill" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight">AI Tag Önerileri</p>
            <p className="text-[11px] text-muted-foreground line-clamp-1">
              {description}
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant={suggestions ? "outline" : "default"}
          disabled={tooShort || mutation.isPending}
          onClick={() => mutation.mutate()}
          className="flex-shrink-0"
        >
          {mutation.isPending ? (
            <>
              <ArrowsClockwise size={14} className="mr-1 animate-spin" />
              Analiz...
            </>
          ) : suggestions ? (
            <>
              <ArrowsClockwise size={14} className="mr-1" />
              Tekrar Öner
            </>
          ) : (
            <>
              <Sparkle size={14} className="mr-1" weight="fill" />
              AI ile Öner
            </>
          )}
        </Button>
      </div>

      {tooShort && !suggestions && (
        <p className="text-xs text-muted-foreground">
          En az <strong>{minLength}</strong> karakter yazınca öneri alabilirsin
          (şu an {trimmed.length}).
        </p>
      )}

      {errorMessage && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2 mt-1">
          <Warning size={14} weight="fill" className="flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {suggestions && suggestions.length === 0 && !mutation.isPending && (
        <p className="text-xs text-muted-foreground">
          Bu metin için uygun bir tag bulunamadı. Açıklamayı genişletmeyi
          dene.
        </p>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {suggestions.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.tag_id);
            return (
              <button
                key={tag.tag_id}
                type="button"
                disabled={isSelected}
                onClick={() => onAdd(tag.tag_id)}
                className={cn(
                  "group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  isSelected
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200 cursor-default"
                    : "bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary"
                )}
                title={
                  isSelected
                    ? "Zaten seçili"
                    : `Skor: ${tag.confidence} (${confidenceLabel(tag.confidence)})`
                }
              >
                {isSelected ? (
                  <Check size={12} weight="bold" />
                ) : (
                  <Plus size={12} weight="bold" />
                )}
                <span>{tag.tag_name}</span>
                {tag.category && !isSelected && (
                  <span className="text-[10px] opacity-60 group-hover:opacity-100">
                    {tag.category}
                  </span>
                )}
                {!isSelected && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "ml-0.5 px-1 py-0 text-[9px] tabular-nums",
                      confidenceColor(tag.confidence)
                    )}
                  >
                    {Math.round(tag.confidence * 100)}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
