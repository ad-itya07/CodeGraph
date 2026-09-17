import { UserPlus, Wrench, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface UseCase {
  icon: LucideIcon;
  scenario: string;
  title: string;
  description: string;
}

const useCases: UseCase[] = [
  {
    icon: UserPlus,
    scenario: "Onboarding",
    title: "\"I don't know where to start.\"",
    description:
      "Find the most connected file in the repository. Understand the core dependency structure. Know what imports what before you touch a single line of code.",
  },
  {
    icon: Wrench,
    scenario: "Refactoring",
    title: "\"I'm afraid to change this.\"",
    description:
      "Run impact analysis on any function. See every caller, every dependent file, every affected symbol — depth by depth — before you make the change.",
  },
  {
    icon: Building2,
    scenario: "Architecture Review",
    title: "\"Is this codebase healthy?\"",
    description:
      "Check the structural health index. Identify coupling hotspots. Surface all circular dependencies and over-connected files before they become technical debt.",
  },
];

export default function UseCasesSection() {
  return (
    <section id="use-cases" className="py-24 bg-surface/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface text-muted text-xs font-medium tracking-wider uppercase mb-4">
            When To Use It
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-4">
            Real developer situations
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            CodeGraph answers the structural questions that come up every week — the ones your IDE doesn&apos;t have a button for.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {useCases.map((uc) => {
            const Icon = uc.icon;
            return (
              <div
                key={uc.scenario}
                className="group rounded-2xl border border-border bg-surface p-8 hover:border-accent/30 hover:bg-surface-elevated transition-all duration-300"
              >
                {/* Scenario label */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/15 transition-colors">
                    <Icon size={16} className="text-accent" />
                  </div>
                  <span className="text-xs font-medium text-muted uppercase tracking-wider">
                    {uc.scenario}
                  </span>
                </div>

                {/* Title (the developer's thought) */}
                <h3 className="text-foreground font-semibold text-lg mb-3 leading-snug">
                  {uc.title}
                </h3>

                {/* Description */}
                <p className="text-muted text-sm leading-relaxed">{uc.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
