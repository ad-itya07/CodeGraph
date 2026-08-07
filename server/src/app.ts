import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { config } from "./config/env.js";

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

// TODO: Mount API routes

export default app;