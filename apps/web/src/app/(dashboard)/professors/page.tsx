"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { professorsApi } from "@/lib/api";
import { ProfileCard } from "@/components/profile-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MagnifyingGlass } from "@phosphor-icons/react";

export default function ProfessorsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", "12");
  if (search) params.set("search", search);

  const { data, isLoading } = useQuery({
    queryKey: ["professors", page, search],
    queryFn: () => professorsApi.list(params.toString()),
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Akademisyenler</h1>
      <div className="relative mb-6 max-w-md">
        <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="İsim, bölüm veya alan ara..."
          className="pl-10"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.data || []).map((p: any) => (
              <ProfileCard key={p.id} {...p} role="PROFESSOR" />
            ))}
          </div>
          {data?.data?.length === 0 && (
            <p className="text-muted-foreground text-center py-12">
              Sonuç bulunamadı
            </p>
          )}
          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Önceki
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-3">
                {page} / {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Sonraki
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
