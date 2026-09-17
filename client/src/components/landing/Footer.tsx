import Link from "next/link";

function GithubIcon({ size = 24, className }: { size?: number, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
      <path d="M9 18c-4.51 2-5-2-7-2"/>
    </svg>
  );
}

const footerLinks = [
  { label: "Features",     href: "/#features" },
  { label: "How it Works", href: "/#how-it-works" },
  { label: "Algorithms",   href: "/#algorithms" },
  { label: "Docs",         href: "/docs" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="8"  cy="8"  r="2"   fill="#06b6d4" />
                <circle cx="2"  cy="3"  r="1.5" fill="#22d3ee" opacity="0.7" />
                <circle cx="14" cy="3"  r="1.5" fill="#22d3ee" opacity="0.7" />
                <circle cx="2"  cy="13" r="1.5" fill="#22d3ee" opacity="0.7" />
                <circle cx="14" cy="13" r="1.5" fill="#22d3ee" opacity="0.7" />
                <line x1="8" y1="8" x2="2"  y2="3"  stroke="#06b6d4" strokeWidth="0.8" opacity="0.5" />
                <line x1="8" y1="8" x2="14" y2="3"  stroke="#06b6d4" strokeWidth="0.8" opacity="0.5" />
                <line x1="8" y1="8" x2="2"  y2="13" stroke="#06b6d4" strokeWidth="0.8" opacity="0.5" />
                <line x1="8" y1="8" x2="14" y2="13" stroke="#06b6d4" strokeWidth="0.8" opacity="0.5" />
              </svg>
            </div>
            <span className="text-foreground font-semibold">
              Code<span className="text-accent">Graph</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex flex-wrap items-center gap-1">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors rounded"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {/* Social & Copyright */}
          <div className="flex items-center gap-6">
            <Link
              href="https://github.com/ad-itya07/CodeGraph"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-foreground transition-colors"
              aria-label="GitHub Repository"
            >
              <GithubIcon size={20} />
            </Link>
            <p className="text-subtle text-sm">
              &copy; {new Date().getFullYear()} CodeGraph
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
