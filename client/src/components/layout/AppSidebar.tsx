"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Workflow,
  Compass,
  Cpu,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tag?: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "How It Works",
    href: "/dashboard/how-it-works",
    icon: Workflow,
  },
  {
    label: "Explore",
    href: "/dashboard/explore",
    icon: Compass,
  },
  {
    label: "Algorithms",
    href: "/dashboard/algorithms",
    icon: Cpu,
  },
  {
    label: "CodeLens",
    href: "/dashboard/codelens",
    icon: Sparkles,
  },
];

export function AppSidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-60 transform transition-transform duration-200 ease-in-out md:relative md:transform-none",
        "border-r border-border bg-surface flex flex-col justify-between select-none",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Primary Navigation */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-subtle font-medium">
          Navigation
        </div>
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors group",
                  isActive
                    ? "bg-surface-elevated text-foreground border border-border-highlight/60 shadow-xs"
                    : "text-muted hover:text-foreground hover:bg-surface-elevated/40 border border-transparent"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    size={16}
                    className={cn(
                      "transition-colors",
                      isActive
                        ? "text-accent"
                        : "text-muted group-hover:text-foreground"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.tag && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border text-subtle">
                    {item.tag}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Engine Status / System Footer */}
      <div className="p-3 border-t border-border/80">
        <div className="px-3 py-2.5 rounded-lg bg-surface-elevated/50 border border-border text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-muted font-mono text-[11px]">Static Engine</span>
          </div>
          <span className="text-[10px] font-mono text-subtle">Ready</span>
        </div>
      </div>
    </aside>
    </>
  );
}
