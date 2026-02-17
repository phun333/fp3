"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { publicationsApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/tag-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MagnifyingGlass, Plus, ArrowSquareOut } from "@phosphor-icons/react";
import Link from "next/link";

export default function PublicationsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", "12");
  if (search) params.set("search", search);

  const { data, isLoading } = useQuery({
    queryKey: ["publications", page, search],
    queryFn: () => publicationsApi.list(params.toString()),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Yayınlar</h1>
        {user?.role === "PROFESSOR" && (
          <Link href="/publications/new">
            <Button>
              <Plus size={18} className="mr-1" /> Yayın Ekle
            </Button>
          </Link>
        )}
      </div>

      <div className="relative mb-6 max-w-md">
        <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Yayın ara..."
          className="pl-10"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {(data?.data || []).map((pub: any) => (
              <Card key={pub.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold">{pub.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {pub.author?.name} {pub.year && `• ${pub.year}`}
                      </p>
                      {pub.abstract && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {pub.abstract}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {pub.tags?.map((tag: any) => (
                          <TagBadge key={tag.id} name={tag.name} category={tag.category} />
                        ))}
                      </div>
                    </div>
                    {pub.url && (
                      <a href={pub.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon">
                          <ArrowSquareOut size={18} />
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {data?.data?.length === 0 && (
            <p className="text-muted-foreground text-center py-12">Sonuç bulunamadı</p>
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
