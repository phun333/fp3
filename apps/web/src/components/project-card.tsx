"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TagBadge } from "./tag-badge";
import { MatchScore } from "./match-score";
import { Users, Clock, Trash, Check, X } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";
import { projectsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const statusLabels: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  OPEN: { label: "Açık", variant: "default" },
  IN_PROGRESS: { label: "Devam Ediyor", variant: "secondary" },
  CLOSED: { label: "Kapalı", variant: "destructive" },
};

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  status: string;
  studentSlots?: number;
  professorSlots?: number;
  owner: { id: string; name: string; department?: string };
  tags: { id: string; name: string; category?: string | null }[];
  _count?: { applications?: number; members?: number };
  matchScore?: number;
}

export function ProjectCard({
  id,
  title,
  description,
  status,
  studentSlots,
  professorSlots,
  owner,
  tags,
  _count,
  matchScore,
}: ProjectCardProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const totalSlots = (studentSlots ?? 0) + (professorSlots ?? 0);
  const s = statusLabels[status] || statusLabels.OPEN;
  const isOwner = user?.id === owner.id;

  const remove = useMutation({
    mutationFn: () => projectsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["my-projects"] });
      qc.invalidateQueries({ queryKey: ["discover"] });
    },
  });

  const stopAndPrevent = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Link href={`/projects/${id}`} className="block">
      <Card
        className={cn(
          "shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full border-border/80 relative",
          remove.isPending && "opacity-60 pointer-events-none",
          remove.isSuccess && "opacity-0 transition-opacity"
        )}
      >
        {/* Owner delete control */}
        {isOwner && (
          <div
            className="absolute top-2 right-2 z-10"
            onClick={stopAndPrevent}
            onPointerDown={stopAndPrevent}
          >
            {confirming ? (
              <div className="flex items-center gap-1 rounded-full bg-background border border-rose-300 shadow-sm pl-2.5 pr-1 py-0.5">
                <span className="text-[11px] font-medium text-rose-700">
                  Silinsin mi?
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  disabled={remove.isPending}
                  onClick={(e) => {
                    stopAndPrevent(e);
                    remove.mutate();
                  }}
                  title="Evet, sil"
                >
                  <Check size={14} weight="bold" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={(e) => {
                    stopAndPrevent(e);
                    setConfirming(false);
                  }}
                  title="Vazgeç"
                >
                  <X size={14} />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur text-muted-foreground hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-200"
                onClick={(e) => {
                  stopAndPrevent(e);
                  setConfirming(true);
                }}
                title="Projeyi sil"
              >
                <Trash size={14} />
              </Button>
            )}
          </div>
        )}

        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                "font-semibold line-clamp-1",
                isOwner && "pr-10"
              )}
            >
              {title}
            </h3>
            <Badge variant={s.variant} className="shrink-0 text-xs">
              {s.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{owner.name}</p>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {description}
          </p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.slice(0, 4).map((tag) => (
                <TagBadge
                  key={tag.id}
                  name={tag.name}
                  category={tag.category}
                />
              ))}
              {tags.length > 4 && (
                <span className="text-xs text-muted-foreground self-center">
                  +{tags.length - 4}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users size={14} />
              {_count?.members ?? 0}/{totalSlots} üye
            </span>
            {_count?.applications !== undefined && (
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {_count.applications} başvuru
              </span>
            )}
          </div>
          {matchScore !== undefined && (
            <div className="mt-3">
              <MatchScore score={matchScore} />
            </div>
          )}
          {remove.isError && (
            <p className="text-xs text-destructive mt-2">
              {(remove.error as any)?.message || "Silinemedi"}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
