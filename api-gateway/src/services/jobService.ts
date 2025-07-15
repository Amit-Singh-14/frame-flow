import { CreateJobData, Job, JobModel } from "@/models/Job";

export interface JobQueueInterface {
    addJob(jobId: number, priority?: number): Promise<void>;
    removeJob(jobId: number): Promise<void>;
    getNextJob(): Promise<number | null>;
}

export class JobService {
    private jobQueue?: JobQueueInterface;

    constructor(jobQueue?: JobQueueInterface) {
        this.jobQueue = jobQueue;
    }

    /**
     * Create a new job
     */
    async create(jobData: CreateJobData): Promise<Job> {
        try {
            const job = await JobModel.create(jobData);
            console.log(`Job created with ID: ${job.id}`);
            return job;
        } catch (error) {
            console.error("Error creating job in service:", error);
            throw new Error("Failed to create job");
        }
    }

    /**
     * Queue a job for processing
     */
    async queueJob(jobId: number): Promise<void> {
        try {
            // Update job status to queued
            await JobModel.updateStatus(jobId, "queued", {
                statusDescription: "Job queued for processing",
                healthStatus: "waiting",
            });

            // Add to job queue if available
            if (this.jobQueue) {
                const job = await JobModel.findById(jobId);
                if (job) {
                    await this.jobQueue.addJob(jobId, job.priority);
                }
            }

            console.log(`Job ${jobId} queued successfully`);
        } catch (error) {
            console.error(`Error queuing job ${jobId}:`, error);
            // Revert status back to pending if queueing fails
            await JobModel.updateStatus(jobId, "pending", {
                statusDescription: "Failed to queue job",
                errorMessage: "Job queueing failed",
            });
            throw new Error("Failed to queue job");
        }
    }

    /**
     * Start processing a job
     */
    async startJob(jobId: number, workerId: string): Promise<void> {
        try {
            await JobModel.updateStatus(jobId, "processing", {
                workerId,
                statusDescription: "Job is being processed",
                healthStatus: "in-progress",
            });

            console.log(`Job ${jobId} started by worker ${workerId}`);
        } catch (error) {
            console.error(`Error starting job ${jobId}:`, error);
            throw new Error("Failed to start job");
        }
    }

    /**
     * Complete a job successfully
     */
    async completeJob(
        jobId: number,
        outputFile: string,
        options?: {
            previewUrl?: string;
            thumbnailUrl?: string;
        }
    ): Promise<void> {
        try {
            await JobModel.updateStatus(jobId, "completed", {
                outputFile,
                previewUrl: options?.previewUrl,
                thumbnailUrl: options?.thumbnailUrl,
                statusDescription: "Job completed successfully",
                healthStatus: "healthy",
            });

            console.log(`Job ${jobId} completed successfully`);
        } catch (error) {
            console.error(`Error completing job ${jobId}:`, error);
            throw new Error("Failed to complete job");
        }
    }

    /**
     * Fail a job
     */
    async failJob(jobId: number, errorMessage: string, errorCode?: string, errorRetriable: boolean = false): Promise<void> {
        try {
            await JobModel.updateStatus(jobId, "failed", {
                errorMessage,
                errorCode,
                errorRetriable,
                statusDescription: `Job failed: ${errorMessage}`,
                healthStatus: "unhealthy",
            });

            console.log(`Job ${jobId} failed: ${errorMessage}`);
        } catch (error) {
            console.error(`Error failing job ${jobId}:`, error);
            throw new Error("Failed to update job status to failed");
        }
    }

    /**
     * Cancel a job
     */
    async cancelJob(jobId: number, reason?: string): Promise<void> {
        try {
            await JobModel.updateStatus(jobId, "cancelled", {
                statusDescription: reason || "Job cancelled by user",
                healthStatus: "unhealthy",
            });

            // Remove from queue if it exists
            if (this.jobQueue) {
                await this.jobQueue.removeJob(jobId);
            }

            console.log(`Job ${jobId} cancelled: ${reason || "No reason provided"}`);
        } catch (error) {
            console.error(`Error cancelling job ${jobId}:`, error);
            throw new Error("Failed to cancel job");
        }
    }

    // Retry a failed job
    async retryJob(jobId: number): Promise<void> {
        try {
            const job = await JobModel.findById(jobId);
            if (!job) {
                throw new Error("Job not found");
            }

            if (job.status !== "failed") {
                throw new Error("Only failed jobs can be retried");
            }

            // Increment retry count
            await JobModel.incrementRetryCount(jobId);

            // Reset job to pending status
            await JobModel.updateStatus(jobId, "pending", {
                statusDescription: `Job retry attempt ${job.retry_count + 1}`,
                healthStatus: "waiting",
                errorMessage: undefined,
                errorCode: undefined,
            });

            // Queue the job again
            await this.queueJob(jobId);

            console.log(`Job ${jobId} queued for retry (attempt ${job.retry_count + 1})`);
        } catch (error) {
            console.error(`Error retrying job ${jobId}:`, error);
            throw new Error("Failed to retry job");
        }
    }

    /**
     * Update job progress
     */
    async updateJobProgress(jobId: number, healthStatus: Job["health_status"], statusDescription: string): Promise<void> {
        try {
            await JobModel.updateJobProgress(jobId, healthStatus, statusDescription);
        } catch (error) {
            console.error(`Error updating job progress ${jobId}:`, error);
            throw new Error("Failed to update job progress");
        }
    }

    /**
     * Get job by ID
     */
    async getById(jobId: number): Promise<Job | null> {
        try {
            return await JobModel.findById(jobId);
        } catch (error) {
            console.error(`Error getting job ${jobId}:`, error);
            throw new Error("Failed to get job");
        }
    }

    /**
     * Get jobs by user ID
     */
    async getByUserId(userId: number): Promise<Job[]> {
        try {
            return await JobModel.findByUserId(userId);
        } catch (error) {
            console.error(`Error getting jobs for user ${userId}:`, error);
            throw new Error("Failed to get user jobs");
        }
    }

    /**
     * Get jobs by video ID
     */
    async getByVideoId(videoId: number): Promise<Job[]> {
        try {
            return await JobModel.findByVideoId(videoId);
        } catch (error) {
            console.error(`Error getting jobs for video ${videoId}:`, error);
            throw new Error("Failed to get video jobs");
        }
    }

    /**
     * Get next job from queue
     */
    async getNextJob(): Promise<Job | null> {
        try {
            // Try to get from job queue first
            if (this.jobQueue) {
                const jobId = await this.jobQueue.getNextJob();
                if (jobId) {
                    return await JobModel.findById(jobId);
                }
            }

            // Fallback to getting queued jobs directly from database
            const queuedJobs = await JobModel.findQueuedJobs(1);
            if (queuedJobs.length > 0) {
                return queuedJobs[0];
            }

            // If no queued jobs, get pending jobs
            const pendingJobs = await JobModel.findPendingJobs(1);
            if (pendingJobs.length > 0) {
                return pendingJobs[0];
            }

            return null;
        } catch (error) {
            console.error("Error getting next job:", error);
            throw new Error("Failed to get next job");
        }
    }

    /**
     * Get jobs by status
     */
    async getJobsByStatus(status: Job["status"], limit?: number): Promise<Job[]> {
        try {
            return await JobModel.findJobsByStatus(status, limit);
        } catch (error) {
            console.error(`Error getting jobs with status ${status}:`, error);
            throw new Error("Failed to get jobs by status");
        }
    }

    /**
     * Get job statistics for a user
     */
    async getUserJobStats(userId: number) {
        try {
            return await JobModel.getJobStats(userId);
        } catch (error) {
            console.error(`Error getting job stats for user ${userId}:`, error);
            throw new Error("Failed to get job statistics");
        }
    }

    /**
     * Get jobs that can be retried
     */
    async getRetriableJobs(maxRetries: number = 3): Promise<Job[]> {
        try {
            return await JobModel.findJobsWithRetries(maxRetries);
        } catch (error) {
            console.error("Error getting retriable jobs:", error);
            throw new Error("Failed to get retriable jobs");
        }
    }

    /**
     * Delete a job
     */
    async deleteJob(jobId: number): Promise<void> {
        try {
            const job = await JobModel.findById(jobId);
            if (!job) {
                throw new Error("Job not found");
            }

            // Remove from queue if it exists
            if (this.jobQueue && (job.status === "pending" || job.status === "queued")) {
                await this.jobQueue.removeJob(jobId);
            }

            await JobModel.delete(jobId);
            console.log(`Job ${jobId} deleted successfully`);
        } catch (error) {
            console.error(`Error deleting job ${jobId}:`, error);
            throw new Error("Failed to delete job");
        }
    }

    /**
     * Get jobs by worker ID
     */
    async getJobsByWorker(workerId: string): Promise<Job[]> {
        try {
            return await JobModel.findJobsByWorker(workerId);
        } catch (error) {
            console.error(`Error getting jobs for worker ${workerId}:`, error);
            throw new Error("Failed to get worker jobs");
        }
    }

    /**
     * Process automatic retries for failed jobs
     */
    async processAutomaticRetries(maxRetries: number = 3): Promise<void> {
        try {
            const retriableJobs = await this.getRetriableJobs(maxRetries);

            for (const job of retriableJobs) {
                try {
                    await this.retryJob(job.id);
                    console.log(`Automatically retried job ${job.id}`);
                } catch (retryError) {
                    console.error(`Failed to automatically retry job ${job.id}:`, retryError);
                }
            }
        } catch (error) {
            console.error("Error processing automatic retries:", error);
            throw new Error("Failed to process automatic retries");
        }
    }

    /**
     * Clean up old completed/failed jobs
     */
    async cleanupOldJobs(daysOld: number = 30): Promise<number> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const completedJobs = await JobModel.findJobsByStatus("completed");
            const failedJobs = await JobModel.findJobsByStatus("failed");

            let deletedCount = 0;
            const jobsToDelete = [...completedJobs, ...failedJobs].filter((job) => new Date(job.created_at) < cutoffDate);

            for (const job of jobsToDelete) {
                try {
                    await JobModel.delete(job.id);
                    deletedCount++;
                } catch (deleteError) {
                    console.error(`Failed to delete old job ${job.id}:`, deleteError);
                }
            }

            console.log(`Cleaned up ${deletedCount} old jobs`);
            return deletedCount;
        } catch (error) {
            console.error("Error cleaning up old jobs:", error);
            throw new Error("Failed to cleanup old jobs");
        }
    }
}

// Export singleton instance
export const jobService = new JobService();
