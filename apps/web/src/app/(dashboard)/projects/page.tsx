"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { projectsApi } from "@/lib/api";
import { ProjectCard } from "@/components/project-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import Link from "next/link";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", "12");
  if (search) params.set("search", search);
  if (status !== "ALL") params.set("status", status);

  const { data, isLoading } = useQuery({
    queryKey: ["projects", page, search, status],
    queryFn: () => projectsApi.list(params.toString()),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Projeler</h1>
        {user?.role === "PROFESSOR" && (
          <Link href="/projects/new">
            <Button>
              <Plus size={18} className="mr-1" /> Yeni Proje
            </Button>
          </Link>
        )}
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Proje ara..."
            className="pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tümü</SelectItem>
            <SelectItem value="OPEN">Açık</SelectItem>
            <SelectItem value="IN_PROGRESS">Devam Ediyor</SelectItem>
            <SelectItem value="CLOSED">Kapalı</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.data || []).map((p: any) => (
              <ProjectCard key={p.id} {...p} />
            ))}
          </div>
          {data?.data?.length === 0 && (
            <p className="text-muted-foreground text-center py-12">Sonuç bulunamadı</p>
          )}
          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Önceki
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-3">
                {page} / {data.meta.totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)}>
                Sonraki
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
