"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AppHeaderProps {
  onMenuToggle?: () => void;
}

export function AppHeader({ onMenuToggle }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 sm:px-6 select-none z-30 shrink-0">
      {/* CodeGraph Logo & Branding */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button 
            onClick={onMenuToggle} 
            className="md:hidden p-2 -ml-2 text-muted hover:text-foreground focus:outline-none"
            aria-label="Toggle Menu"
          >
            <Menu size={20} />
          </button>
        )}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="2" fill="var(--accent)" />
              <circle cx="2" cy="3" r="1.5" fill="var(--accent-light)" opacity="0.7" />
              <circle cx="14" cy="3" r="1.5" fill="var(--accent-light)" opacity="0.7" />
              <circle cx="2" cy="13" r="1.5" fill="var(--accent-light)" opacity="0.7" />
              <circle cx="14" cy="13" r="1.5" fill="var(--accent-light)" opacity="0.7" />
              <line x1="8" y1="8" x2="2" y2="3" stroke="var(--accent)" strokeWidth="0.8" opacity="0.5" />
              <line x1="8" y1="8" x2="14" y2="3" stroke="var(--accent)" strokeWidth="0.8" opacity="0.5" />
              <line x1="8" y1="8" x2="2" y2="13" stroke="var(--accent)" strokeWidth="0.8" opacity="0.5" />
              <line x1="8" y1="8" x2="14" y2="13" stroke="var(--accent)" strokeWidth="0.8" opacity="0.5" />
            </svg>
          </div>
          <span className="text-foreground font-semibold text-base tracking-tight font-heading">
            Code<span className="text-accent">Graph</span>
          </span>
        </Link>
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-surface-elevated text-muted border border-border">
          v0.1.0
        </span>
      </div>

      {/* User / Account Area */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2.5 pl-3 pr-2 py-1 rounded-lg bg-surface-elevated border border-border text-xs">
            <div className="w-5 h-5 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent text-[11px] font-mono font-semibold">
              {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={12} />}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-foreground text-xs leading-none">
                {user.name || "Developer"}
              </span>
              <span className="text-[10px] text-muted font-mono leading-none mt-0.5">
                {user.email}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted hover:text-foreground hover:bg-surface-elevated border border-transparent hover:border-border transition-colors cursor-pointer"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
