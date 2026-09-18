"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SlideItem {
  src: string;
  alt: string;
  title: string;
  tag: string;
}

const SLIDES: SlideItem[] = [
  {
    src: "/1.webp",
    alt: "CodeGraph Dashboard",
    title: "User Dashboard",
    tag: "User Dashboard",
  },
  {
    src: "/2.webp",
    alt: "CodeGraph Structural Health Metrics and Analytics",
    title: "Structural Health & Metrics",
    tag: "Repository Overview",
  },
  {
    src: "/3.webp",
    alt: "CodeGraph Interactive Symbol Graph Visualizer",
    title: "Interactive Symbol Graph",
    tag: "Graph Exploration",
  },
  {
    src: "/4.webp",
    alt: "CodeGraph Analysis Engine",
    title: "Advanced Analytics Engine",
    tag: "Analytics Engine",
  },
  {
    src: "/5.webp",
    alt: "CodeGraph Impact and Blast Radius Analysis",
    title: "Impact & Blast Radius Analysis",
    tag: "Impact Analysis",
  },
];

const AUTO_PLAY_INTERVAL = 4500; // 4.5 seconds per slide

export default function HeroSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Handle auto-play timer
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      goToNext();
    }, AUTO_PLAY_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, goToNext]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      goToPrev();
    } else if (e.key === "ArrowRight") {
      goToNext();
    }
  };

  return (
    <div
      className="relative w-full max-w-4xl mx-auto mt-14 focus:outline-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="CodeGraph Interface Slideshow"
    >
      {/* Glow aura behind the frame */}
      <div
        className="absolute -inset-2 rounded-3xl blur-3xl opacity-25 pointer-events-none transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--accent) 0%, rgba(255,255,255,0.05) 50%, transparent 80%)",
        }}
        aria-hidden="true"
      />

      {/* Main Single Box Window Container */}
      <div className="relative rounded-2xl border border-border/80 bg-surface/90 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300 hover:border-border-highlight">

        {/* Top bar — Window Chrome */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-surface-elevated/70 select-none">
          {/* Mac-style window buttons */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-danger/80 border border-danger" />
            <div className="w-3 h-3 rounded-full bg-warning/80 border border-warning" />
            <div className="w-3 h-3 rounded-full bg-success/80 border border-success" />
            <div className="ml-3 hidden sm:flex items-center gap-2 bg-background/60 border border-border/40 rounded-md px-3 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-subtle text-xs font-mono">
                codegraph / {SLIDES[currentIndex].tag.toLowerCase().replace(/\s+/g, "-")}
              </span>
            </div>
          </div>

          {/* Current Slide Title / Tag */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-muted hidden md:inline font-medium">
              {SLIDES[currentIndex].title}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">
              {currentIndex + 1} / {SLIDES.length}
            </span>
          </div>
        </div>

        {/* Slideshow Image Area */}
        <div className="relative w-full aspect-[1356/652] bg-black/80 overflow-hidden group">
          {SLIDES.map((slide, index) => {
            const isActive = index === currentIndex;
            return (
              <div
                key={slide.src}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${isActive ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 pointer-events-none scale-[1.01]"
                  }`}
                aria-hidden={!isActive}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1024px"
                  priority={index === 0}
                  className="object-cover object-top select-none pointer-events-none"
                />
              </div>
            );
          })}

          {/* Navigation Arrows (visible on hover) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 text-foreground/80 hover:text-foreground hover:bg-black/90 border border-border/60 backdrop-blur-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 hover:scale-105 shadow-lg"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/60 text-foreground/80 hover:text-foreground hover:bg-black/90 border border-border/60 backdrop-blur-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 hover:scale-105 shadow-lg"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Bottom Control Bar with Dot Indicators (. . .) */}
        <div className="flex items-center justify-center py-3.5 border-t border-border/60 bg-surface-elevated/60 backdrop-blur-md">
          {/* Dot representation (. . . . .) showing active slide */}
          <div
            className="flex items-center gap-2"
            role="tablist"
            aria-label="Slide indicators"
          >
            {SLIDES.map((slide, index) => {
              const isActive = index === currentIndex;
              return (
                <button
                  key={slide.src}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => goToSlide(index)}
                  className="group/dot py-1 px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full transition-all"
                >
                  <span
                    className={`block h-2 rounded-full transition-all duration-300 ease-out ${isActive
                        ? "w-8 bg-accent shadow-[0_0_10px_rgba(250,250,250,0.6)]"
                        : "w-2 bg-muted/40 hover:bg-muted/80 hover:scale-125"
                      }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
