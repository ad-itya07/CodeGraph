import fs from "fs";
import path from "path";

import { Parser } from "@/parser/index.js";
import { updateRepositoryCommitSha } from "@/persistence/repository.js";
import { cloneRepo } from "@/utils/git/cloneRepo.js";
import { getCommitSha } from "@/utils/git/getCommitSha.js";
import { GraphBuilder } from "@/graph/GraphBuilder.js";

class RepositoryProcessorService {
    async process(repositoryId: string, repositoryUrl: string) {
        const clonePath = path.join("uploads", `repo-${repositoryId}`);

        try {

            if (!fs.existsSync("uploads")) {
                fs.mkdirSync("uploads", { recursive: true });
            }

            await cloneRepo(repositoryUrl, clonePath);

            const commitSha = getCommitSha(clonePath);

            await updateRepositoryCommitSha(repositoryId, commitSha);

            const parser = new Parser();
            const parsedRepository = await parser.parse(clonePath);

            const graphBuilder = new GraphBuilder();
            const graph = graphBuilder.build(parsedRepository);

            return {
                parsedRepository,
                graph,
            };

        } finally {

            if (fs.existsSync(clonePath)) {
                fs.rmSync(clonePath, {
                    recursive: true,
                    force: true,
                });
            }

        }
    }
}

export default new RepositoryProcessorService();