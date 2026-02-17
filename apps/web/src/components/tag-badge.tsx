import { Badge } from "@/components/ui/badge";

const categoryColors: Record<string, string> = {
  "AI/ML": "bg-violet-100 text-violet-700 border-violet-200",
  Data: "bg-blue-100 text-blue-700 border-blue-200",
  Web: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Mobil: "bg-orange-100 text-orange-700 border-orange-200",
  Güvenlik: "bg-red-100 text-red-700 border-red-200",
  Donanım: "bg-amber-100 text-amber-700 border-amber-200",
  Yazılım: "bg-cyan-100 text-cyan-700 border-cyan-200",
  Diğer: "bg-gray-100 text-gray-700 border-gray-200",
};

interface TagBadgeProps {
  name: string;
  category?: string | null;
  className?: string;
}

export function TagBadge({ name, category, className }: TagBadgeProps) {
  const color = categoryColors[category || "Diğer"] || categoryColors["Diğer"];
  return (
    <Badge variant="outline" className={`${color} text-xs font-medium ${className || ""}`}>
      {name}
    </Badge>
  );
}
