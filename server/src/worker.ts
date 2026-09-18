import "dotenv/config";
import redis from "./lib/redis.js";
import { createAnalysisWorker, stopAnalysisWorker } from "./worker/analysisWorker.js";

async function main() {
  console.log("Starting CodeGraph Analysis Worker process...");

  if (!redis.isOpen) {
    try {
      await redis.connect();
      console.log("Worker Redis client connected successfully");
    } catch (err) {
      console.error("Worker Redis client failed to connect:", err);
    }
  }

  const worker = createAnalysisWorker();
  console.log("CodeGraph Analysis Worker is listening for jobs...");

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down analysis worker gracefully...`);
    await stopAnalysisWorker();
    if (redis.isOpen) {
      await redis.quit();
    }
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("Fatal error in Analysis Worker:", err);
  process.exit(1);
});
