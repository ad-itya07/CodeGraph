import { NextFunction, Request, Response } from "express";
import repositoryService from "../services/repository.service.js";

class RepositoryController {
    async createRepository(req: Request, res: Response, next: NextFunction) {
        try {
            const { url } = req.body;
            const repository = await repositoryService.createRepository(url);

            return res.status(201).json({
                success: true,
                message: "Repository created successfully",
                data: repository,
            })
        } catch (err) {
            next(err);
        }
    }

    async getRepository(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const repository = await repositoryService.getRepository(id as string);

            return res.status(200).json({
                success: true,
                message: "Repository fetched successfully",
                data: repository,
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new RepositoryController();
