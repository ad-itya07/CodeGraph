import { Worker, Job } from "bullmq";
import {
  ANALYSIS_QUEUE_NAME,
  RepositoryAnalysisJobData,
  createRedisClient,
} from "@/lib/queue.js";
import repositoryProcessorService from "@/services/repositoryProcessor.service.js";

let workerInstance: Worker<RepositoryAnalysisJobData> | null = null;

export function createAnalysisWorker(): Worker<RepositoryAnalysisJobData> {
  if (workerInstance) {
    return workerInstance;
  }

  const workerRedisClient = createRedisClient();

  workerInstance = new Worker<RepositoryAnalysisJobData>(
    ANALYSIS_QUEUE_NAME,
    async (job: Job<RepositoryAnalysisJobData>) => {
      const { repositoryId, userId } = job.data;
      console.log(`[BullMQ Worker] Processing job ${job.id} for repository ${repositoryId}`);
      await repositoryProcessorService.processJob(repositoryId, userId);
      console.log(`[BullMQ Worker] Completed job ${job.id} for repository ${repositoryId}`);
    },
    {
      connection: workerRedisClient,
      concurrency: 2,
      drainDelay: 300,             
      stalledInterval: 300000,    
      lockDuration: 300000,
      metrics: { maxDataPoints: 0 },
    }
  );

  workerInstance.on("completed", (job: Job<RepositoryAnalysisJobData>) => {
    console.log(`[BullMQ Worker] Job ${job.id} completed successfully`);
  });

  workerInstance.on("failed", (job: Job<RepositoryAnalysisJobData> | undefined, err: Error) => {
    console.error(`[BullMQ Worker] Job ${job?.id} failed with error:`, err.message);
  });

  workerInstance.on("error", (err: Error) => {
    console.error("[BullMQ Worker] Worker encountered error:", err);
  });

  return workerInstance;
}

export async function stopAnalysisWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.close();
    workerInstance = null;
  }
}
