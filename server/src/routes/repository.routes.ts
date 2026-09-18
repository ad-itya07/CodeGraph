import repositoryController from "@/controllers/repository.controller.js";
import { authenticate } from "@/middlewares/auth.js";
import { Router } from "express";

const router: Router = Router();

router.use(authenticate);

router.post("/", repositoryController.createRepository);
router.get("/", repositoryController.getUserRepositories);
router.get("/overview", repositoryController.getUserOverview);
router.get("/:id/status", repositoryController.getRepositoryStatus);
router.post("/:id/retry", repositoryController.retryRepository);
router.get("/:id", repositoryController.getRepository);
router.get("/:id/graph", repositoryController.getRepositoryGraph);

export default router;
