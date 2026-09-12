import repositoryController from "@/controllers/repository.controller.js";
import { Router } from "express";

const router: Router = Router();

router.post("/", repositoryController.createRepository);
router.get("/:id", repositoryController.getRepository);
router.get("/:id/graph", repositoryController.getRepositoryGraph);

export default router;
