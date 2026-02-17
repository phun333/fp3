"use client";

import { useQuery } from "@tanstack/react-query";
import { tagsApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TagSelectorProps {
  selected: string[];
  onChange: (ids: string[]) => void;
  max?: number;
}

export function TagSelector({ selected, onChange, max = 10 }: TagSelectorProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: () => tagsApi.list(),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className="h-7 w-20 rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const grouped = data?.data?.grouped || {};

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else if (selected.length < max) {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {selected.length}/{max} tag seçildi
      </p>
      {Object.entries(grouped).map(([category, tags]) => (
        <div key={category}>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            {category}
          </h4>
          <div className="flex flex-wrap gap-2">
            {(tags as any[]).map((tag: any) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggle(tag.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                  selected.includes(tag.id)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:border-primary/50"
                )}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
