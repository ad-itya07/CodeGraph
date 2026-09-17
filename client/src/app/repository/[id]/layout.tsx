"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { AppHeader } from "@/components/layout/AppHeader";
import { RepositorySidebar } from "@/components/explorer/RepositorySidebar";
import { repositoriesApi } from "@/api/repositories";

export default function RepositoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }> | { id: string };
}) {
  const unwrappedParams = typeof (params as any).then === "function" ? use(params as Promise<{ id: string }>) : (params as { id: string });
  const id = unwrappedParams.id;

  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login");
    }
  }, [user, isAuthLoading, router]);

  const { data: repository, isLoading: isRepoLoading } = useQuery({
    queryKey: ["repository", id],
    queryFn: () => repositoriesApi.get(id),
    enabled: !!id && !!user,
  });

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-muted/30 border-t-accent rounded-full animate-spin" />
          <span className="text-sm font-mono text-muted">Loading repository...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Global Application Header */}
      <AppHeader onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

      {/* Main Repository Shell Viewport */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <RepositorySidebar repository={repository} isLoading={isRepoLoading} />

        {/* Content Pane */}
        <main className="flex-1 flex min-h-0 min-w-0 bg-background overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}
