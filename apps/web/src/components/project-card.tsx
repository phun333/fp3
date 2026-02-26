import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TagBadge } from "./tag-badge";
import { MatchScore } from "./match-score";
import { Users, Clock } from "@phosphor-icons/react";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  OPEN: { label: "Açık", variant: "default" },
  IN_PROGRESS: { label: "Devam Ediyor", variant: "secondary" },
  CLOSED: { label: "Kapalı", variant: "destructive" },
};

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  status: string;
  maxMembers: number;
  owner: { id: string; name: string; department?: string };
  tags: { id: string; name: string; category?: string | null }[];
  _count?: { applications?: number };
  matchScore?: number;
}

export function ProjectCard({
  id,
  title,
  description,
  status,
  maxMembers,
  owner,
  tags,
  _count,
  matchScore,
}: ProjectCardProps) {
  const s = statusLabels[status] || statusLabels.OPEN;

  return (
    <Link href={`/projects/${id}`}>
      <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full border-border/80">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold line-clamp-1">{title}</h3>
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
                <TagBadge key={tag.id} name={tag.name} category={tag.category} />
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
              Maks {maxMembers} kişi
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
        </CardContent>
      </Card>
    </Link>
  );
}
