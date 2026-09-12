import { NextFunction, Request, Response } from "express";
import repositoryService from "../services/repository.service.js";
import { serializeGraph } from "@/graph/serialization/graphSerializer.js";

class RepositoryController {
    async createRepository(req: Request, res: Response, next: NextFunction) {
        try {
            const { url } = req.body;
            const repository = await repositoryService.createRepository(url, req.userId!);

            return res.status(201).json({
                success: true,
                message: "Repository created successfully",
                data: repository,
            })
        } catch (err) {
            next(err);
        }
    }

    async getUserRepositories(req: Request, res: Response, next: NextFunction) {
        try {
            const repositories = await repositoryService.getUserRepositories(req.userId!);

            return res.status(200).json({
                success: true,
                message: "Repositories fetched successfully",
                data: repositories,
            });
        } catch (err) {
            next(err);
        }
    }

    async getRepository(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const repository = await repositoryService.getRepository(id as string, req.userId!);

            return res.status(200).json({
                success: true,
                message: "Repository fetched successfully",
                data: repository,
            });
        } catch (err) {
            next(err);
        }
    }

    async getRepositoryGraph(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const graph = await repositoryService.getRepositoryGraph(id as string, req.userId!);

            return res.status(200).json({
                success: true,
                message: "Graph fetched successfully",
                data: serializeGraph(graph),
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new RepositoryController();
