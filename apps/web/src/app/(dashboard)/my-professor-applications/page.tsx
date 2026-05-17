"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { professorApplicationsApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardText } from "@phosphor-icons/react";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  PENDING: { label: "Beklemede", variant: "secondary" },
  ACCEPTED: { label: "Kabul Edildi", variant: "default" },
  REJECTED: { label: "Reddedildi", variant: "destructive" },
};

export default function MyProfessorApplicationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-professor-applications"],
    queryFn: () => professorApplicationsApi.mine(),
  });

  const apps: any[] = data?.data || [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <ClipboardText size={28} weight="duotone" className="text-primary" />
        <h1 className="text-3xl font-bold">Hoca Başvurularım</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6 -mt-3">
        Matching üzerinden hocalara gönderdiğin proje önerileri.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : apps.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground mb-4">Henüz hocaya başvurmadın</p>
            <Link href="/matching">
              <Button>Eşleştirmeye Git</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {apps.map((app: any) => {
            const ini = (app.professor?.name || "")
              .split(" ").map((n: string) => n[0]).join("").slice(0, 2);
            const s = statusMap[app.status] || statusMap.PENDING;
            return (
              <Card key={app.id}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {ini}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{app.professor?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {app.professor?.department}
                        </p>
                      </div>
                    </div>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Önerin
                    </p>
                    <p className="font-medium text-sm">{app.title}</p>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {app.description}
                    </p>
                  </div>
                  {app.message && (
                    <div className="rounded-lg bg-muted/40 border border-border/60 p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Mesajın
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{app.message}</p>
                    </div>
                  )}
                  {app.status === "ACCEPTED" && app.createdProjectId ? (
                    <Link href={`/projects/${app.createdProjectId}`}>
                      <Button size="sm" variant="outline">
                        Oluşturulan projeyi aç →
                      </Button>
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
