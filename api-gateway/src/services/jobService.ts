import { JobModel } from "@/models/Job";
import { Job, JobStatus } from "@/types";
import { FileUtils } from "@/utils/file";
import { JobQueue } from "@/utils/jobQueue";

export interface JobFilters {
    status?: JobStatus;
    startDate?: string;
    endDate?: string;
    search?: string;
}

export interface PaginationOptions {
    page: number;
    limit: number;
}

export interface JobListResponse {
    jobs: Job[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalJobs: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export class JobService {
    private static jobQueue = new JobQueue();

    static async createJob(jobData: { user_id: number; input_file: string; conversion_settings?: string; file_size?: number }): Promise<Job> {
        try {
            const job = await JobModel.create(jobData);
            this.jobQueue.enqueue(job.id);

            return job;
        } catch (error) {
            console.error("Error in JobServices.createJob:", error);
            throw error;
        }
    }

    // Job status transitions
    static async transitionToProcessing(jobId: number): Promise<void> {
        try {
            await JobModel.updateStatus(jobId, JobStatus.PROCESSING);
            console.log(`Job ${jobId} transitioned to processing`);
        } catch (error) {
            console.error("Error transitioning job to processing:", error);
            throw error;
        }
    }
    static async transitionToCompleted(jobId: number, outputFile: string): Promise<void> {
        try {
            await JobModel.updateStatus(jobId, JobStatus.COMPLETED, outputFile);
            this.jobQueue.markCompleted(jobId);
            console.log(`Job ${jobId} completed successfully`);
        } catch (error) {
            console.error("Error transitioning job to completed:", error);
            throw error;
        }
    }

    static async transitionToFailed(jobId: number, errorMessage: string): Promise<void> {
        try {
            await JobModel.updateStatus(jobId, JobStatus.FAILED, undefined, errorMessage);
            this.jobQueue.markFailed(jobId);
            console.log(`Job ${jobId} failed: ${errorMessage}`);
        } catch (error) {
            console.error("Error transitioning job to failed:", error);
            throw error;
        }
    }

    // Job retrieval with filtering and pagination
    static async getUserJobs(
        userId: number,
        filters: JobFilters = {},
        pagination: PaginationOptions = { page: 1, limit: 10 }
    ): Promise<JobListResponse> {
        try {
            let jobs = await JobModel.findByUserId(userId);
            jobs = this.applyFilter(jobs, filters);

            // pagination
            const totalJobs = jobs.length;
            const totalPages = Math.ceil(totalJobs / pagination.limit);
            const offset = (pagination.page - 1) * pagination.limit;

            // applying pagination
            const paginatedJobs = jobs.slice(offset, offset + pagination.limit);

            return {
                jobs: paginatedJobs,
                pagination: {
                    currentPage: pagination.page,
                    totalPages,
                    totalJobs,
                    hasNext: pagination.page < totalPages,
                    hasPrev: pagination.page > 1,
                },
            };
        } catch (error) {
            console.error("Error getting user jobs:", error);
            throw error;
        }
    }

    // filters to job list

    private static applyFilter(jobs: Job[], filters: JobFilters): Job[] {
        let filteredJobs = [...jobs];

        if (filters.status) {
            filteredJobs = filteredJobs.filter((job) => job.status === filters.status);
        }

        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            filteredJobs = filteredJobs.filter((job) => new Date(job.created_at) >= startDate);
        }

        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            filteredJobs = filteredJobs.filter((job) => new Date(job.created_at) <= endDate);
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredJobs = filteredJobs.filter(
                (job) => job.input_file.toLowerCase().includes(searchTerm) || (job.output_file && job.output_file.toLowerCase().includes(searchTerm))
            );
        }

        return filteredJobs;
    }

    // job retry logic
    static async retryJob(jobId: number, userId: number): Promise<Job> {
        try {
            const job = await JobModel.findById(jobId);

            if (!job) {
                throw new Error("Job not found");
            }

            if (job.user_id !== userId) {
                throw new Error("Accesss denied");
            }

            if (job.status !== JobStatus.FAILED) {
                throw new Error("Only failed jobs can be retried");
            }

            // reset job status to pending
            await JobModel.updateStatus(jobId, JobStatus.PENDING);
            // add back to queue
            this.jobQueue.enqueue(jobId);

            // return udpated job
            const updatedJob = await JobModel.findById(jobId);
            console.log(`Job ${jobId} queued for retry`);

            return updatedJob!;
        } catch (error) {
            console.error("Error retrying job:", error);
            throw error;
        }
    }

    static async cancelJob(jobId: number, userId: number): Promise<void> {
        try {
            const job = await JobModel.findById(jobId);

            if (!job) {
                throw new Error("Job not found");
            }

            if (job.user_id !== userId) {
                throw new Error("Access denied");
            }

            if (job.status === JobStatus.COMPLETED) {
                throw new Error("Cannot cancel completed job");
            }

            // remove from queue if pending
            if (job.status === JobStatus.PENDING) {
                this.jobQueue.removeFromQueue(jobId);
            }

            // Update status to failed with cancellation message
            await JobModel.updateStatus(jobId, JobStatus.FAILED, undefined, "Job cancelled by user");

            console.log(`Job ${jobId} cancelled by user ${userId}`);
        } catch (error) {
            console.error("Error cancelling job:", error);
            throw error;
        }
    }

    // Job deletion with file cleanup
    static async deleteJob(jobId: number, userId: number): Promise<void> {
        try {
            const job = await JobModel.findById(jobId);

            if (!job) {
                throw new Error("Job not found");
            }

            if (job.user_id !== userId) {
                throw new Error("Access denied");
            }

            // Remove from queue if pending
            if (job.status === JobStatus.PENDING) {
                this.jobQueue.removeFromQueue(jobId);
            }

            // Clean up files
            await this.cleanupJobFiles(job);

            // Delete from database
            await JobModel.delete(jobId);

            console.log(`Job ${jobId} deleted successfully`);
        } catch (error) {
            console.error("Error deleting job:", error);
            throw error;
        }
    }

    private static async cleanupJobFiles(job: Job): Promise<void> {
        try {
            // delete input file if it exists
            if (job.input_file) {
                const deleted = await FileUtils.deleteFile(job.input_file);
                if (deleted) {
                    console.log(`Deleted input file: ${job.input_file}`);
                }
            }

            // delete output file if exists
            if (job.output_file) {
                const deleted = await FileUtils.deleteFile(job.output_file);
                if (deleted) {
                    console.log(`Deleted output file: ${job.output_file}`);
                }
            }
        } catch (error) {
            console.error("Error cleaning up job files:", error);
        }
    }

    static async cleanupOldJobs(daysOld: number = 30, uploadDirectory?: string): Promise<number> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            // TODO:
            // Get all jobs older than cutoff date
            // Note: This would need a new method in JobModel to get jobs by date
            // For now, we can clean up files in upload directory using FileUtils
            if (uploadDirectory) {
                const hoursOld = daysOld * 24;
                await FileUtils.cleanUpOldFiles(uploadDirectory, hoursOld);
                console.log(`Cleaned up files older than ${daysOld} days from ${uploadDirectory}`);
            }

            return 0; // Return number of cleaned jobs (would need DB implementation)
        } catch (error) {
            console.error("Error cleaning up old jobs:", error);
            throw error;
        }
    }

    // Queue management methods
    static getQueueStats() {
        return this.jobQueue.getQueueStats();
    }

    static getNextJobInQueue(): number | null {
        return this.jobQueue.peek();
    }

    static dequeueNextJob(): number | null {
        return this.jobQueue.dequeue();
    }

    static isJobProcessing(jobId: number): boolean {
        return this.jobQueue.isProcessing(jobId);
    }

    // Enhanced job stats with queue information
    static async getUserJobsWithQueueInfo(userId: number) {
        try {
            const [stats, queueStats] = await Promise.all([JobModel.getJobStats(userId), Promise.resolve(this.getQueueStats())]);

            return {
                ...stats,
                queue: queueStats,
            };
        } catch (error) {
            console.error("Error getting user jobs with queue info:", error);
            throw error;
        }
    }

    // Get job file sizes for statistics
    static async getJobFileSizes(job: Job): Promise<{ input: number; output: number }> {
        try {
            const inputSize = job.input_file ? await FileUtils.getFileSize(job.input_file) : 0;

            const outputSize = job.output_file ? await FileUtils.getFileSize(job.output_file) : 0;

            return { input: inputSize, output: outputSize };
        } catch (error) {
            console.error("Error getting file size stats", error);
            throw error;
        }
    }
}
