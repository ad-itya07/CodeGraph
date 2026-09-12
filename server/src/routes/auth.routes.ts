import authController from "@/controllers/auth.controller.js";
import { authenticate } from "@/middlewares/auth.js";
import { Router } from "express";

const router: Router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authenticate, authController.me);

export default router;
