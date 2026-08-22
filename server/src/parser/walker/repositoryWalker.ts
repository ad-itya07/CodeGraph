import { NotFoundError } from '@/errors/NotFoundError.js';
import fs from 'fs';
import path from 'path';
import { RepositoryFiles } from '../models/RepositoryFiles.js';

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
export function getRepositoryFiles(dirPath: string): RepositoryFiles {
  const targetDir = dirPath;

  const sourceFiles: string[] = [];
  const packageJsonFiles: string[] = [];
  const tsconfigJsonFiles: string[] = [];
  const jsconfigJsonFiles: string[] = [];

  if (!fs.existsSync(targetDir)) throw new NotFoundError('Repository directory not found');

  function walk(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;

        walk(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (entry.name === 'package.json') {
        packageJsonFiles.push(fullPath);
        continue;
      }

      if (entry.name === 'tsconfig.json') {
        tsconfigJsonFiles.push(fullPath);
        continue;
      }

      if (entry.name === 'jsconfig.json') {
        jsconfigJsonFiles.push(fullPath);
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();

      if (ALLOWED_EXTENSIONS.has(ext)) {
        sourceFiles.push(fullPath);
      }
    }
  }

  walk(targetDir);

  return {
    sourceFiles,
    packageJsonFiles,
    tsconfigJsonFiles,
    jsconfigJsonFiles
  };
}
