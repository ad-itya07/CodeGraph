import app from "./app.js";
import redis from "./lib/redis.js";
import { createAnalysisWorker } from "./worker/analysisWorker.js";

const PORT = process.env.PORT || 3000;

redis
  .connect()
  .then(() => {
    console.log("Redis connected successfully");

    // In dev / default mode, start worker in-process unless explicitly disabled
    if (process.env.RUN_WORKER !== "false") {
      createAnalysisWorker();
      console.log("In-process BullMQ Analysis Worker started");
    }
  })
  .catch((err) => {
    console.error("Redis unavailable:", err);
  });

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});