import { RepoCloneError } from "@/errors/RepoCloneError.js";
import { spawn } from "child_process";

export function cloneRepo(repoUrl: string, targetPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const process = spawn("git", ["clone", repoUrl, targetPath], {
            stdio: "inherit",
        });

        process.on("error", () => {
            reject(new RepoCloneError());
        });

        process.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new RepoCloneError());
            }
        });
    });
}