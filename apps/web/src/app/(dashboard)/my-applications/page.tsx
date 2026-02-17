"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { applicationsApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/tag-badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  PENDING: { label: "Beklemede", variant: "secondary" },
  ACCEPTED: { label: "Kabul Edildi", variant: "default" },
  REJECTED: { label: "Reddedildi", variant: "destructive" },
};

export default function MyApplicationsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["my-applications", page],
    queryFn: () => applicationsApi.myApplications(`page=${page}&limit=10`),
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Başvurularım</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {(data?.data || []).map((app: any) => {
              const s = statusMap[app.status] || statusMap.PENDING;
              return (
                <Card key={app.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <Link
                          href={`/projects/${app.project?.id}`}
                          className="font-semibold hover:text-primary transition-colors"
                        >
                          {app.project?.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {app.project?.owner?.name} • {app.project?.owner?.department}
                        </p>
                        {app.message && (
                          <p className="text-sm mt-2">{app.message}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {app.project?.tags?.map((tag: any) => (
                            <TagBadge key={tag.id} name={tag.name} category={tag.category} />
                          ))}
                        </div>
                      </div>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {data?.data?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Henüz başvurunuz yok</p>
              <Link href="/projects">
                <Button>Projelere Göz At</Button>
              </Link>
            </div>
          )}
          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Önceki</Button>
              <span className="flex items-center text-sm text-muted-foreground px-3">{page} / {data.meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)}>Sonraki</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
