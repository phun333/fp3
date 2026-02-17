import { Progress } from "@/components/ui/progress";

interface MatchScoreProps {
  score: number;
}

export function MatchScore({ score }: MatchScoreProps) {
  const color =
    score >= 70
      ? "text-emerald-600"
      : score >= 40
        ? "text-amber-600"
        : "text-muted-foreground";

  return (
    <div className="flex items-center gap-2">
      <Progress value={score} className="h-2 flex-1" />
      <span className={`text-sm font-semibold ${color}`}>%{score}</span>
    </div>
  );
}
