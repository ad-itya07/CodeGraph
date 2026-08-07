import express, { Express, Request, Response } from "express";
import cors from "cors";
import { config } from "./config/env.js";
import repositoryRoutes from "./routes/repository.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app: Express = express();

// ==========================================
// Middleware Configuration
// ==========================================

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// Routes Configuration
// ==========================================

// Health Check Endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Root Route
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to CodeGraph API Server",
    version: "1.0.0",
  });
});

app.use("/api/repository", repositoryRoutes);


// Error handler
app.use(errorHandler);

export default app;