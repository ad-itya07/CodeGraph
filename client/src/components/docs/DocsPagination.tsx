import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DocItem } from "@/lib/docs-navigation";

interface DocsPaginationProps {
  prev?: DocItem;
  next?: DocItem;
}

export function DocsPagination({ prev, next }: DocsPaginationProps) {
  return (
    <div className="mt-14 pt-6 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 select-none">
      {prev ? (
        <Link
          href={prev.href}
          className="flex flex-col items-start gap-1 p-3.5 rounded-lg border border-border bg-surface-elevated/30 hover:bg-surface-elevated/70 hover:border-border-highlight transition-colors flex-1 text-left group"
        >
          <div className="flex items-center gap-1.5 text-xs text-muted group-hover:text-foreground">
            <ChevronLeft size={14} />
            <span>Previous</span>
          </div>
          <span className="text-sm font-medium text-foreground font-heading">
            {prev.number ? `${prev.number} ${prev.title}` : prev.title}
          </span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {next ? (
        <Link
          href={next.href}
          className="flex flex-col items-end gap-1 p-3.5 rounded-lg border border-border bg-surface-elevated/30 hover:bg-surface-elevated/70 hover:border-border-highlight transition-colors flex-1 text-right group"
        >
          <div className="flex items-center gap-1.5 text-xs text-muted group-hover:text-foreground">
            <span>Next</span>
            <ChevronRight size={14} />
          </div>
          <span className="text-sm font-medium text-foreground font-heading">
            {next.number ? `${next.number} ${next.title}` : next.title}
          </span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
