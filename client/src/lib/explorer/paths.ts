/**
 * Path presentation & normalization utilities for CodeGraph Explorer.
 *
 * IMPORTANT PRINCIPLE:
 * Backend paths (e.g. "/home/.../server/uploads/repo-abc123/src/index.ts") are canonical
 * machine identities used internally for AST parsing, graph node IDs, and cross-file resolution.
 *
 * This module converts backend paths into human-readable repository-relative display paths
 * WITHOUT altering canonical backend paths or node IDs.
 */

/**
 * Normalizes any backend file path to a clean, repository-relative path.
 * Removes machine-specific / host filesystem prefixes (e.g. "/home/.../uploads/repo-<id>/").
 *
 * @param rawPath - The raw file path from the backend (absolute or relative)
 * @param repositoryId - Optional repository ID to match repo-<id> folder precisely
 * @returns Clean repository-relative path, e.g., "server/src/middleware/auth.middleware.ts"
 */
export function getRepositoryRelativePath(
  rawPath: string | null | undefined,
  repositoryId?: string | null
): string {
  if (!rawPath) return "";

  // Normalize Windows backslashes to forward slashes
  let p = rawPath.replace(/\\/g, "/").trim();

  // Strip leading/trailing whitespace
  if (!p) return "";

  // 1. If repositoryId is provided, look for `repo-${repositoryId}/`
  if (repositoryId) {
    const repoMarker = `repo-${repositoryId}/`;
    const markerIndex = p.indexOf(repoMarker);
    if (markerIndex !== -1) {
      return p.slice(markerIndex + repoMarker.length);
    }
  }

  // 2. Generic regex for `uploads/repo-[^/]+/` or `repo-[^/]+/`
  const repoRegex = /(?:^|\/)(?:uploads\/)?repo-[^/]+\/(.*)$/;
  const match = p.match(repoRegex);
  if (match && match[1] !== undefined) {
    return match[1];
  }

  // 3. Check for `/uploads/[^/]+/`
  const uploadsRegex = /(?:^|\/)uploads\/[^/]+\/(.*)$/;
  const uploadsMatch = p.match(uploadsRegex);
  if (uploadsMatch && uploadsMatch[1] !== undefined) {
    return uploadsMatch[1];
  }

  // 4. If path starts with leading slash (e.g. absolute path without standard upload prefix)
  if (p.startsWith("/")) {
    // Remove leading slash
    p = p.replace(/^\/+/, "");
  }

  return p;
}

/**
 * Returns a display path including repository name as root, or just relative path.
 *
 * Example:
 * getDisplayPath("/home/.../uploads/repo-123/src/index.ts", "Creditsea") => "Creditsea/src/index.ts"
 */
export function getDisplayPath(
  rawPath: string | null | undefined,
  repositoryName?: string | null,
  repositoryId?: string | null
): string {
  const relPath = getRepositoryRelativePath(rawPath, repositoryId);
  if (repositoryName && relPath) {
    return `${repositoryName}/${relPath}`;
  }
  return relPath || repositoryName || "";
}

/**
 * Splits a file path into breadcrumb parts for repository navigation.
 *
 * Example:
 * getBreadcrumbParts("/home/.../repo-123/server/src/auth.ts", "Creditsea")
 * => ["Creditsea", "server", "src", "auth.ts"]
 */
export function getBreadcrumbParts(
  rawPath: string | null | undefined,
  repositoryName?: string | null,
  repositoryId?: string | null
): string[] {
  const relPath = getRepositoryRelativePath(rawPath, repositoryId);
  const parts = relPath.split("/").filter(Boolean);
  if (repositoryName) {
    return [repositoryName, ...parts];
  }
  return parts;
}
