"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Search, Plus, Database, Network, Activity, FolderGit2, Loader2, X } from "lucide-react";
import { AddRepositoryModal } from "@/components/dashboard/AddRepositoryModal";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RepositoryCard } from "@/components/dashboard/RepositoryCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useQuery } from "@tanstack/react-query";
import { repositoriesApi } from "@/api/repositories";

// Utility to format large numbers (e.g., 42800 -> 42.8K)
function formatNumber(num: number): string | number {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut to focus search (Cmd/Ctrl + K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const { data: overview, isLoading: isOverviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ["repository", "overview"],
    queryFn: repositoriesApi.getOverview,
  });

  const { data: repositories, isLoading: isRepositoriesLoading, refetch: refetchRepositories } = useQuery({
    queryKey: ["repository", "list"],
    queryFn: repositoriesApi.list,
    refetchInterval: (query) => {
      const hasActive = query.state.data?.some(
        (r) => r.status === "QUEUED" || r.status === "PROCESSING"
      );
      return hasActive ? 1500 : false;
    },
  });

  // Keep track of active repositories count to refetch overview when an analysis finishes
  const prevActiveCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (repositories) {
      const activeCount = repositories.filter(
        (r) => r.status === "QUEUED" || r.status === "PROCESSING"
      ).length;

      if (prevActiveCountRef.current !== null && prevActiveCountRef.current > 0 && activeCount === 0) {
        refetchOverview();
      }
      prevActiveCountRef.current = activeCount;
    }
  }, [repositories, refetchOverview]);

  const handleRepositoryAdded = () => {
    refetchOverview();
    refetchRepositories();
  };

  // Filter repositories based on search query
  const filteredRepositories = repositories?.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground mb-1">
          Welcome back, {user?.name || "Developer"}
        </h1>
        <p className="text-sm text-muted">
          Static code intelligence & graph analysis across your repositories.
        </p>
      </div>

      {/* Control Bar: Search & Add Repository */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-14 rounded-lg bg-surface border border-border text-sm text-foreground focus:outline-none focus:border-border-highlight focus:ring-1 focus:ring-accent transition-all placeholder:text-muted"
          />
          {!searchQuery ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 h-5 rounded border border-border bg-surface-elevated text-[10px] font-mono text-muted">
                <span className="text-[10px]">⌘</span>K
              </kbd>
            </div>
          ) : (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors focus:outline-none"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="shrink-0 flex items-center gap-2 px-4 py-2 bg-accent text-background text-sm font-semibold rounded-lg hover:bg-accent-light transition-colors shadow-sm"
        >
          <Plus size={16} />
          <span>Add Repository</span>
        </button>
      </div>

      {/* Global Workspace Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Repositories"
          value={overview?.repositoryCount ?? 0}
          icon={<FolderGit2 size={16} />}
          isLoading={isOverviewLoading}
        />
        <MetricCard
          title="Code Entities"
          value={overview ? formatNumber(overview.totalCodeEntities) : 0}
          icon={<Database size={16} />}
          isLoading={isOverviewLoading}
        />
        <MetricCard
          title="Relationships"
          value={overview ? formatNumber(overview.totalRelationships) : 0}
          icon={<Network size={16} />}
          isLoading={isOverviewLoading}
        />
        <MetricCard
          title="Average Health"
          value={overview?.averageHealthIndex ?? (overview?.repositoryCount === 0 ? "—" : 0)}
          subtitle="Across all repositories"
          icon={<Activity size={16} />}
          isLoading={isOverviewLoading}
        />
      </div>

      {/* Repository Grid / Empty State */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold font-heading text-foreground mb-4">Your Repositories</h2>
        
        {isRepositoriesLoading ? (
          <div className="flex items-center justify-center py-20 text-muted">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : filteredRepositories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRepositories.map((repo) => (
              <RepositoryCard key={repo.id} repository={repo} />
            ))}
          </div>
        ) : repositories && repositories.length > 0 ? (
          <div className="text-center py-16 px-4 bg-surface/30 border border-border border-dashed rounded-xl">
            <p className="text-muted">No repositories found matching &quot;{searchQuery}&quot;.</p>
            <button 
              onClick={() => setSearchQuery("")}
              className="mt-4 text-sm text-accent hover:underline focus:outline-none"
            >
              Clear search
            </button>
          </div>
        ) : (
          <EmptyState onAddRepository={() => setIsAddModalOpen(true)} />
        )}
      </div>

      <AddRepositoryModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={handleRepositoryAdded}
      />
    </div>
  );
}
