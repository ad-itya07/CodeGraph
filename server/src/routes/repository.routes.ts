import repositoryController from "@/controllers/repository.controller.js";
import { Router } from "express";

const router: Router = Router();

router.post("/", repositoryController.createRepository);
router.get("/:id", repositoryController.getRepository);

export default router;
