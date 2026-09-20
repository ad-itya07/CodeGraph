import { Queue, QueueOptions } from "bullmq";
import { Redis } from "ioredis";
import { config } from "@/config/env.js";

export const ANALYSIS_QUEUE_NAME = "repository-analysis";

export interface RepositoryAnalysisJobData {
  repositoryId: string;
  userId: string;
}

export function createRedisClient(): Redis {
  return new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
    family: 0,
  });
}

export const queueRedisClient = createRedisClient();

const queueOptions: QueueOptions = {
  connection: queueRedisClient,
  defaultJobOptions: {
    attempts: 1, // Deterministic code analysis; failure will be captured and reported
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs for debugging
      age: 24 * 3600,
    },
    removeOnFail: {
      count: 100,
      age: 24 * 3600,
    },
  },
};

export const analysisQueue = new Queue<RepositoryAnalysisJobData>(
  ANALYSIS_QUEUE_NAME,
  queueOptions
);
