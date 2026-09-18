import { Router } from "express";

import { authenticate } from "@/middlewares/auth.js";
import analyticsController from "@/controllers/analytics.controller.js";

const router: Router = Router();

router.use(authenticate);

router.get("/:id/analysis/impact", analyticsController.analyzeImpact);
router.get("/:id/analysis/dependencies", analyticsController.analyzeDependencies);
router.get("/:id/analysis/paths", analyticsController.analyzeCallPath);
router.get("/:id/analysis/cycles", analyticsController.analyzeCycles);
router.get("/:id/analysis/ordering", analyticsController.analyzeDependencyOrdering);
router.get("/:id/analysis/connectivity", analyticsController.analyzeConnectivity);

export default router;