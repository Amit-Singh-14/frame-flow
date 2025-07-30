import Redis from "ioredis";
import { JobQueueInterface } from "./jobService";

export class RedisQueueService implements JobQueueInterface {
    private redis: Redis;
    private queueKey: string;
    private processingKey: string;

    constructor(redisUrl?: string) {
        this.redis = new Redis(redisUrl || "redis://localhost:6379");
        this.queueKey = "videoJobs:queue";
        this.processingKey = "video_jobs:processing";

        this.redis.on("error", (err) => {
            console.error("Redis connection error", err);
        });

        this.redis.on("connect", () => {
            console.log("✅ Connected to Redis");
        });
    }

    /**
     * Add a job to the queue with optional priority
     */
    async addJob(jobId: number, priority: number = 0): Promise<void> {
        try {
            // Use redis sorted set for priority queue
            // lower priority number = higher priority(processing first)
            await this.redis.zadd(this.queueKey, priority, jobId.toString());

            // also track job status
            await this.redis.hset(`job:${jobId}`, {
                id: jobId,
                status: "queued",
                queuedAt: new Date().toISOString(),
                priority,
            });

            console.log(`Job ${jobId} added to queue with priority ${priority}`);
        } catch (error) {
            console.error(`Error adding job ${jobId} to queue:`, error);
            throw new Error("Failed to add job to queue");
        }
    }

    /**
     * Remove a job from the queue
     */
    async removeJob(jobId: number): Promise<void> {
        try {
            // remove from queue
            await this.redis.zrem(this.queueKey, jobId.toString());

            // Remove from processing set if it exists
            await this.redis.srem(this.processingKey, jobId.toString());

            // remove job metadata
            await this.redis.del(`job:${jobId}`);
            console.log(`Job ${jobId} removed from queue`);
        } catch (error) {
            console.error(`Error removing job ${jobId} from queue:`, error);
            throw new Error("Failed to remove job from queue");
        }
    }

    /**
     * Get the next job from the queue (highest priority first)
     */
    async getNextJob(): Promise<number | null> {
        try {
            // Get the job with lowest priroty value (higest priority)
            const result = await this.redis.zpopmin(this.queueKey);

            if (!result || result.length === 0) return null;

            const jobId = parseInt(result[0]);

            // move to processing set
            await this.redis.sadd(this.processingKey, jobId.toString());

            // update job status
            await this.redis.hset(`job:${jobId}`, {
                status: "processing",
                processedAt: new Date().toISOString(),
            });

            console.log(`Job ${jobId} retrieved from queue for processing`);

            return jobId;
        } catch (error) {
            console.error("Error getting next job from queue:", error);
            throw new Error("Failed to get next job from queue");
        }
    }

    /**
     * Mark a job as completed and remove from prcessing
     */
    async completedJob(jobId: number): Promise<void> {
        try {
            // Remove from processing set
            await this.redis.srem(this.processingKey, jobId.toString());

            // update job status
            await this.redis.hset(`job:${jobId}`, {
                status: "completed",
                completedAt: new Date().toISOString(),
            });

            console.log(`Job ${jobId} marked as completed`);
        } catch (error) {
            console.error(`Error completed job ${jobId}:`, error);
            throw new Error("Failed to completed job");
        }
    }

    /**
     * Mark a job as failed and remove from processing
     */
    async failJob(jobId: number, errorMessage?: string): Promise<void> {
        try {
            // remove from processing set
            await this.redis.srem(this.processingKey, jobId.toString());

            // update job status
            await this.redis.hset(`job:${jobId}`, {
                status: "failed",
                failedAt: new Date().toISOString(),
                errorMessage: errorMessage || "Unknown error",
            });

            console.log(`Job ${jobId} marked as failed: ${errorMessage}`);
        } catch (error) {
            console.error(`Error failing job ${jobId}:`, error);
            throw new Error("Failed to fail job");
        }
    }

    /**
     * Get queue statistics
     */
    async getQueueStats(): Promise<{
        queuedJobs: number;
        processingJobs: number;
        totalJobs: number;
    }> {
        try {
            const queuedJobs = await this.redis.zcard(this.queueKey);
            const processingJobs = await this.redis.scard(this.processingKey);

            return {
                queuedJobs,
                processingJobs,
                totalJobs: queuedJobs + processingJobs,
            };
        } catch (error) {
            console.error("Error getting queue stats:", error);
            throw new Error("Failed to get queue statistics");
        }
    }

    /**
     * Get all jobs in queue (for monitoring)
     */
    async getQueuedJobs(): Promise<Array<{ jobId: number; priority: number }>> {
        try {
            const jobs = await this.redis.zrange(this.queueKey, 0, -1, "WITHSCORES");
            const result = [];

            for (let i = 0; i < jobs.length; i += 2) {
                result.push({
                    jobId: parseInt(jobs[i]),
                    priority: parseInt(jobs[i + 1]),
                });
            }

            return result;
        } catch (error) {
            console.error("Error getting queued jobs:", error);
            throw new Error("Failed to get queued jobs");
        }
    }

    /**
     * Get all jobs currently being processed
     */

    async getProcessingJobs(): Promise<number[]> {
        try {
            const jobs = await this.redis.smembers(this.processingKey);
            return jobs.map((job) => parseInt(job));
        } catch (error) {
            console.error("Error getting processing jobs:", error);
            throw new Error("Failed to get processing jobs");
        }
    }

    /**
     * Clear all jobs from queue (for testing/maintenance)
     */
    async clearQueue(): Promise<void> {
        try {
            await this.redis.del(this.queueKey);
            await this.redis.del(this.processingKey);

            // clear all job metadata
            const keys = await this.redis.keys("jobs:*");

            if (keys.length > 0) {
                await this.redis.del(...keys);
            }

            console.log("Queue cleared successfully");
        } catch (error) {
            console.error("Error clearing queue", error);
            throw new Error("Failed to clear queue");
        }
    }

    /**
     * Requeue a job(for retry functionality)
     */
    async requeueJob(jobId: number, priority: number = 0): Promise<void> {
        try {
            // Remove from processing if it exists
            await this.redis.srem(this.processingKey, jobId.toString());

            // add back to queue
            await this.addJob(jobId, priority);

            console.log(`Job ${jobId} requeued with priority ${priority}`);
        } catch (error) {
            console.error(`Error requeuing job ${jobId}:`, error);
            throw new Error("Failed to requeue job");
        }
    }

    /**
     * Get job info from Redis
     */
    async getJobInfo(jobId: number): Promise<any> {
        try {
            const jobInfo = await this.redis.hgetall(`job:${jobId}`);
            return Object.keys(jobInfo).length > 0 ? jobInfo : null;
        } catch (error) {
            console.error(`Error getting job info for ${jobId}:`, error);
            throw new Error("Failed to get job info");
        }
    }

    /**
     * Health check for Redis connection
     */
    async healthCheck(): Promise<boolean> {
        try {
            const result = await this.redis.ping();
            return result === "PONG";
        } catch (error) {
            console.error("Redis health check failed:", error);
            return false;
        }
    }

    /**
     * Close Redis connection
     */
    async disconnect(): Promise<void> {
        await this.redis.quit();
    }
}

// Export singleton instance
export const redisQueueService = new RedisQueueService();
