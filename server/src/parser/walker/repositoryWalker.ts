import { NotFoundError } from '@/errors/NotFoundError.js';
import fs from 'fs';
import path from 'path';

// Supported file extensions
const ALLOWED_EXTENSIONS = new Set(['.tsx', '.ts', '.js', '.jsx']);

// Directories to ignore during traversal
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'coverage',
  '.turbo',
  'out',
]);

// takes directory path and returns array of all supported file paths
export function getSupportedRepositoryFiles(dirPath: string): string[] {
  const targetDir = dirPath;
  const results: string[] = [];

  if (!fs.existsSync(targetDir)) {
    throw new NotFoundError('Repository directory not found');
  }

  function walk(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith('.')) {
          continue;
        }
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ALLOWED_EXTENSIONS.has(ext)) {
          results.push(fullPath);
        }
      }
    }
  }

  walk(targetDir);
  return results;
}
