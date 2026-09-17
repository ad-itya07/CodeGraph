"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { repositoriesApi } from "@/api/repositories";

function GithubIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

interface AddRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddRepositoryModal({ isOpen, onClose, onSuccess }: AddRepositoryModalProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!url) {
      setError("Please enter a GitHub repository URL");
      return;
    }

    // Basic GitHub URL validation
    if (!/^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+/.test(url)) {
      setError("Please enter a valid GitHub repository URL");
      return;
    }

    try {
      setIsLoading(true);
      await repositoriesApi.create(url);
      setUrl("");
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; error?: string } } };
      setError(error.response?.data?.message || error.response?.data?.error || "Failed to add repository");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
        onClick={() => !isLoading && onClose()} 
      />
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground font-heading">Add Repository</h2>
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-md text-muted hover:text-foreground hover:bg-surface-elevated transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 p-4 mb-6 rounded-lg bg-accent/5 border border-accent/20">
              <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                <GithubIcon size={20} className="text-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">GitHub Integration</h3>
                <p className="text-xs text-muted mt-0.5">
                  CodeGraph will fetch, parse, and analyze your repository structure securely.
                </p>
              </div>
            </div>

            <Input
              label="Repository URL"
              type="text"
              placeholder="https://github.com/username/repository"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              error={error}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 bg-accent text-background text-sm font-semibold rounded-lg hover:bg-accent-light transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <span>Add Repository</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
