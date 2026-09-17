"use client";

import Link from "next/link";
import { FolderGit2, ExternalLink } from "lucide-react";
import type { Repository } from "@/types";

interface RepositoryCardProps {
  repository: Repository;
}

export function RepositoryCard({ repository }: RepositoryCardProps) {
  // Format date nicely
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(repository.createdAt));

  return (
    <Link
      href={`/dashboard/repository/${repository.id}`}
      className="group flex flex-col p-5 bg-surface border border-border rounded-xl hover:border-accent/40 hover:bg-surface-elevated/30 transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 text-accent group-hover:scale-105 transition-transform">
          <FolderGit2 size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-foreground truncate font-heading group-hover:text-accent transition-colors">
            {repository.name}
          </h3>
          <p className="text-xs text-subtle truncate mt-0.5" title={repository.url}>
            {repository.url.replace(/^https?:\/\/(www\.)?github\.com\//, '')}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
        <span className="text-[11px] text-muted font-mono uppercase tracking-wider">
          Added {formattedDate}
        </span>
        <span className="text-muted group-hover:text-foreground transition-colors">
          <ExternalLink size={14} />
        </span>
      </div>
    </Link>
  );
}
