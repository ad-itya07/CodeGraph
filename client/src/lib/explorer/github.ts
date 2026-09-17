import type { SymbolLocation } from "@/types";
import { getRepositoryRelativePath } from "./paths";

/**
 * Formats a clean, direct GitHub URL for a file or symbol location.
 *
 * Principle:
 * Constructs GitHub URL as:
 * https://github.com/<owner>/<repo>/blob/<commit>/<relative-file-path>#L<startLine>-L<endLine>
 */
export function formatGitHubUrl(
  repoUrl: string | undefined | null,
  commitSha: string | undefined | null,
  filePath: string | undefined | null,
  location?: SymbolLocation | null,
  repositoryId?: string | null
): string | null {
  if (!repoUrl || !filePath) return null;

  // Normalize raw backend path to repository-relative path
  const relativePath = getRepositoryRelativePath(filePath, repositoryId);
  if (!relativePath) return null;

  // Normalize repository URL (strip .git, trailing slashes, ssh prefix)
  let cleanUrl = repoUrl.trim();
  if (cleanUrl.endsWith(".git")) {
    cleanUrl = cleanUrl.slice(0, -4);
  }
  if (cleanUrl.endsWith("/")) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  if (cleanUrl.startsWith("git@github.com:")) {
    cleanUrl = cleanUrl.replace("git@github.com:", "https://github.com/");
  }
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = `https://${cleanUrl}`;
  }

  // Determine ref (commit SHA or default branch)
  const ref = commitSha?.trim() || "main";

  let url = `${cleanUrl}/blob/${ref}/${relativePath}`;

  if (location && typeof location.startLine === "number") {
    if (
      typeof location.endLine === "number" &&
      location.endLine > location.startLine
    ) {
      url += `#L${location.startLine}-L${location.endLine}`;
    } else {
      url += `#L${location.startLine}`;
    }
  }

  return url;
}
