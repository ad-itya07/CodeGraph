import { CommitShaError } from "@/errors/CommitShaError.js";
import { execFileSync } from "child_process";

export function getCommitSha(repoPath: string): string {
    try {
        return execFileSync("git", ["rev-parse", "HEAD"], {
            cwd: repoPath,
            encoding: "utf-8",
        }).trim();
    } catch {
        throw new CommitShaError();
    }
}