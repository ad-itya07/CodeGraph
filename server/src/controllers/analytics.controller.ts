import { NextFunction, Request, Response } from "express";
import analyticsService from "@/services/analytics.service.js";
import activityService from "@/services/activity.service.js";

class AnalyticsController {
    async analyzeImpact(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { nodeId, maxDepth } = req.query;

            const result = await analyticsService.analyzeImpact({
                repositoryId: id as string,
                userId: req.userId!,
                sourceNodeId: nodeId as string,
                options: maxDepth !== undefined
                    ? { maxDepth: Number(maxDepth) }
                    : undefined
            });

            return res.status(200).json({
                success: true,
                message: "Impact analysis completed successfully",
                data: result,
            });
        } catch (err) {
            next(err);
        }
    }

    async analyzeDependencies(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { nodeId, maxDepth } = req.query;

            const result = await analyticsService.analyzeDependencies({
                repositoryId: id as string,
                userId: req.userId!,
                sourceNodeId: nodeId as string,
                options:
                    maxDepth !== undefined
                        ? { maxDepth: Number(maxDepth) }
                        : undefined,
            });

            return res.status(200).json({
                success: true,
                message: "Dependency analysis completed successfully",
                data: result,
            });
        } catch (err) {
            next(err);
        }
    }

    async analyzeCallPath(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { sourceNodeId, targetNodeId } = req.query;

            const result = await analyticsService.analyzeCallPath({
                repositoryId: id as string,
                userId: req.userId!,
                sourceNodeId: sourceNodeId as string,
                targetNodeId: targetNodeId as string,
            });

            return res.status(200).json({
                success: true,
                message: "Call path analysis completed successfully",
                data: result,
            });
        } catch (err) {
            next(err);
        }
    }

    async analyzeCycles(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const result = await analyticsService.analyzeCycles({
                repositoryId: id as string,
                userId: req.userId!,
            });

            return res.status(200).json({
                success: true,
                message: "Cycle analysis completed successfully",
                data: result,
            });
        } catch (err) {
            next(err);
        }
    }

    async analyzeDependencyOrdering(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { sourceNodeId } = req.query;

            const result = await analyticsService.analyzeDependencyOrdering({
                repositoryId: id as string,
                userId: req.userId!,
                sourceNodeId: sourceNodeId as string,
            });

            return res.status(200).json({
                success: true,
                message: "Dependency ordering analysis completed successfully",
                data: result,
            });
        } catch (err) {
            next(err);
        }
    }

    async analyzeConnectivity(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { nodeId } = req.query;

            const result = await analyticsService.analyzeConnectivity({
                repositoryId: id as string,
                userId: req.userId!,
                nodeId: nodeId as string,
            });

            return res.status(200).json({
                success: true,
                message: "Connectivity analysis completed successfully",
                data: result,
            });
        } catch (err) {
            next(err);
        }
    }

    async getRecentActivity(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { analysisType, entityKind, limit } = req.query;

            const activities = await activityService.getRecentActivities({
                repositoryId: id as string,
                userId: req.userId!,
                analysisType: analysisType as string | undefined,
                entityKind: entityKind as string | undefined,
                limit: limit ? Number(limit) : undefined,
            });

            return res.status(200).json({
                success: true,
                message: "Recent activity fetched successfully",
                data: activities,
            });
        } catch (err) {
            next(err);
        }
    }
}

export default new AnalyticsController();