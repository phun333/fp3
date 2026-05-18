import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TagBadge } from "./tag-badge";
import { MatchScore } from "./match-score";

interface ProfileCardProps {
  id: string;
  name: string;
  department: string;
  bio?: string | null;
  role: "STUDENT" | "PROFESSOR";
  tags: { id: string; name: string; category?: string | null }[];
  matchScore?: number;
  _count?: { projects?: number; publications?: number };
}

export function ProfileCard({
  id,
  name,
  department,
  bio,
  role,
  tags,
  matchScore,
  _count,
}: ProfileCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Sadece hocaların detay sayfası var (/professors/[id]).
  // Öğrenciler için detay sayfası yok → kart tıklanamaz kalır.
  const href = role === "PROFESSOR" ? `/professors/${id}` : null;

  const content = (
    <Card
      className={
        "shadow-sm h-full border-border/80" +
        (href
          ? " hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
          : "")
      }
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{name}</h3>
            <p className="text-sm text-muted-foreground">{department}</p>
            {_count && (
              <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                {_count.projects !== undefined && (
                  <span>{_count.projects} proje</span>
                )}
                {_count.publications !== undefined && (
                  <span>{_count.publications} yayın</span>
                )}
              </div>
            )}
          </div>
        </div>
        {bio && (
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
            {bio}
          </p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.slice(0, 5).map((tag) => (
              <TagBadge key={tag.id} name={tag.name} category={tag.category} />
            ))}
            {tags.length > 5 && (
              <span className="text-xs text-muted-foreground self-center">
                +{tags.length - 5}
              </span>
            )}
          </div>
        )}
        {matchScore !== undefined && (
          <div className="mt-3">
            <MatchScore score={matchScore} />
          </div>
        )}
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
