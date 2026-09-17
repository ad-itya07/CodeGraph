"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

function GithubIcon({ size = 24, className }: { size?: number, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
      <path d="M9 18c-4.51 2-5-2-7-2"/>
    </svg>
  );
}

const navLinks = [
  { label: "Features",     href: "/#features" },
  { label: "How it Works", href: "/#how-it-works" },
  { label: "Algorithms",   href: "/#algorithms" },
  { label: "Docs",         href: "/docs" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8"  r="2"   fill="#06b6d4" />
              <circle cx="2" cy="3"  r="1.5" fill="#22d3ee" opacity="0.7" />
              <circle cx="14" cy="3" r="1.5" fill="#22d3ee" opacity="0.7" />
              <circle cx="2" cy="13" r="1.5" fill="#22d3ee" opacity="0.7" />
              <circle cx="14" cy="13"r="1.5" fill="#22d3ee" opacity="0.7" />
              <line x1="8" y1="8" x2="2"  y2="3"  stroke="#06b6d4" strokeWidth="0.8" opacity="0.5" />
              <line x1="8" y1="8" x2="14" y2="3"  stroke="#06b6d4" strokeWidth="0.8" opacity="0.5" />
              <line x1="8" y1="8" x2="2"  y2="13" stroke="#06b6d4" strokeWidth="0.8" opacity="0.5" />
              <line x1="8" y1="8" x2="14" y2="13" stroke="#06b6d4" strokeWidth="0.8" opacity="0.5" />
            </svg>
          </div>
          <span className="text-foreground font-semibold text-lg tracking-tight">
            Code<span className="text-accent">Graph</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors rounded-md hover:bg-surface"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="https://github.com/ad-itya07/CodeGraph"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-foreground transition-colors"
            aria-label="GitHub Repository"
          >
            <GithubIcon size={20} />
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-accent text-background hover:bg-accent-light transition-colors"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden p-2 text-muted hover:text-foreground transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-6 py-4 flex flex-col gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="px-4 py-2.5 text-sm text-muted hover:text-foreground hover:bg-surface rounded-lg transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="mt-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-accent text-background hover:bg-accent-light transition-colors text-center"
          >
            Get Started
          </Link>
          <div className="mt-4 pt-4 border-t border-border flex justify-center">
            <Link
              href="https://github.com/ad-itya07/CodeGraph"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-foreground transition-colors flex items-center gap-2 text-sm"
            >
              <GithubIcon size={18} />
              GitHub Repository
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
