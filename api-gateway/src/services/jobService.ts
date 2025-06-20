import { JobModel } from "@/models/Job";
import { Job, JobStatus } from "@/types";
import { FileUtils } from "@/utils/file";
import { JobQueue } from "@/utils/jobQueue";
import { JobMonitor } from "./jobMonitor";
import { JobHelper } from "@/utils/jobHelper";
import { JobStatusManger } from "./jobStatusManger";

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
    statistics: ReturnType<typeof JobHelper.getJobListStatistics>;
}

export interface EnhancedJobResponse {
    job: Job;
    statusHistory: any[];
    estimatedCompletion: Date | null;
    progress: number;
    healthStatus: "healthy" | "warning" | "critical";
    canRetry: { canRetry: boolean; reason?: string };
    canCancel: { canCancel: boolean; reason?: string };
    metrics: any;
}

export class EnhancedJobService {
    private static jobQueue = new JobQueue();
    private static isInitialized = false;

    /**
     * Initialize the enhanced job service
     */
    static async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        console.log("Initializing Enhanced Job Service...");

        // Start job monitoring
        JobMonitor.startMonitoring();

        // Validate and fix any existing inconsistent job states
        try {
            const validationResult = await JobStatusManger.validateAndFixJobStates();
            if (validationResult.fixed > 0) {
                console.log(`Fixed ${validationResult.fixed} inconsistent job states on startup`);
            }
        } catch (error) {
            console.error("Error during startup job validation:", error);
        }

        this.isInitialized = true;
        console.log("Enhanced Job Service initialized successfully");
    }

    /**
     * Shutdown the service gracefully
     */
    static async shutdown(): Promise<void> {
        console.log("Shutting down Enhanced Job Service...");
        JobMonitor.stopMonitoring();
        this.isInitialized = false;
    }

    /**
     * Create job with enhanced validation and status management
     */
    static async createJob(jobData: { user_id: number; input_file: string; conversion_settings?: string; file_size?: number }): Promise<Job> {
        try {
            // Validate input file exists
            const fileExists = await FileUtils.fileExists(jobData.input_file);
            if (!fileExists) {
                throw new Error(`Input file does not exist: ${jobData.input_file}`);
            }

            // Create job in database
            const job = await JobModel.create(jobData);

            // Record initial status transition
            await JobStatusManger.transitionJobStatus(job.id, JobStatus.PENDING, undefined, undefined, "Job created and queued");

            // Add to processing queue
            this.jobQueue.enqueue(job.id);

            console.log(`Job ${job.id} created and queued successfully`);
            return job;
        } catch (error) {
            console.error("Error in EnhancedJobService.createJob:", error);
            throw error;
        }
    }

    /**
     * Enhanced job status transitions with validation
     */
    static async transitionToProcessing(jobId: number): Promise<void> {
        try {
            await JobStatusManger.transitionJobStatus(jobId, JobStatus.PROCESSING, undefined, undefined, "Job started processing");
        } catch (error) {
            console.error("Error transitioning job to processing:", error);
            throw error;
        }
    }

    static async transitionToCompleted(jobId: number, outputFile: string): Promise<void> {
        try {
            // Validate output file exists
            const outputExists = await FileUtils.fileExists(outputFile);
            if (!outputExists) {
                throw new Error(`Output file does not exist: ${outputFile}`);
            }

            await JobStatusManger.transitionJobStatus(jobId, JobStatus.COMPLETED, outputFile, undefined, "Job completed successfully");

            this.jobQueue.markCompleted(jobId);
            console.log(`Job ${jobId} completed successfully`);
        } catch (error) {
            console.error("Error transitioning job to completed:", error);
            throw error;
        }
    }

    static async transitionToFailed(jobId: number, errorMessage: string): Promise<void> {
        try {
            await JobStatusManger.transitionJobStatus(jobId, JobStatus.FAILED, undefined, errorMessage, "Job failed during processing");

            this.jobQueue.markFailed(jobId);
            console.log(`Job ${jobId} failed: ${errorMessage}`);
        } catch (error) {
            console.error("Error transitioning job to failed:", error);
            throw error;
        }
    }

    /**
     * Get enhanced job details with status history and metrics
     */
    static async getEnhancedJobDetails(jobId: number, userId: number): Promise<EnhancedJobResponse> {
        try {
            const job = await JobModel.findById(jobId);

            if (!job) {
                throw new Error("Job not found");
            }

            if (job.user_id !== userId) {
                throw new Error("Access denied");
            }

            // Get enhanced details
            const statusHistory = JobStatusManger.getJobStatusHistory(jobId);
            const estimatedCompletion = JobStatusManger.calculateEstimationTime(job);
            const progress = JobStatusManger.getJobProgress(job);
            const healthStatus = JobHelper.determineHealthStatus(job);
            const canRetry = JobHelper.canRetryJob(job);
            const canCancel = JobHelper.canCancelJob(job);
            const metrics = await JobHelper.calculateJobMetrics(job);

            return {
                job,
                statusHistory,
                estimatedCompletion,
                progress,
                healthStatus,
                canRetry,
                canCancel,
                metrics,
            };
        } catch (error) {
            console.error("Error getting enhanced job details:", error);
            throw error;
        }
    }

    /**
     * Enhanced job listing with statistics and health info
     */
    static async getUserJobs(
        userId: number,
        filters: JobFilters = {},
        pagination: PaginationOptions = { page: 1, limit: 10 }
    ): Promise<JobListResponse> {
        try {
            let jobs = await JobModel.findByUserId(userId);

            // Apply filters
            jobs = this.applyFilter(jobs, filters);

            // Calculate statistics before pagination
            const statistics = JobHelper.getJobListStatistics(jobs);

            // Apply pagination
            const totalJobs = jobs.length;
            const totalPages = Math.ceil(totalJobs / pagination.limit);
            const offset = (pagination.page - 1) * pagination.limit;
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
                statistics,
            };
        } catch (error) {
            console.error("Error getting user jobs:", error);
            throw error;
        }
    }

    /**
     * Enhanced job retry with validation
     */
    static async retryJob(jobId: number, userId: number): Promise<Job> {
        try {
            const job = await JobModel.findById(jobId);

            if (!job) {
                throw new Error("Job not found");
            }

            if (job.user_id !== userId) {
                throw new Error("Access denied");
            }

            // Check if job can be retried
            const retryCheck = JobHelper.canRetryJob(job);
            if (!retryCheck.canRetry) {
                throw new Error(retryCheck.reason || "Job cannot be retried");
            }

            // Validate input file still exists
            const fileExists = await FileUtils.fileExists(job.input_file);
            if (!fileExists) {
                throw new Error("Cannot retry job: input file no longer exists");
            }

            // Reset job status using status manager
            await JobStatusManger.transitionJobStatus(jobId, JobStatus.PENDING, undefined, undefined, "Job retry requested by user");

            // Add back to queue
            this.jobQueue.enqueue(jobId);

            // Get updated job
            const updatedJob = await JobModel.findById(jobId);
            console.log(`Job ${jobId} queued for retry`);

            return updatedJob!;
        } catch (error) {
            console.error("Error retrying job:", error);
            throw error;
        }
    }

    /**
     * Enhanced job cancellation
     */
    static async cancelJob(jobId: number, userId: number): Promise<void> {
        try {
            const job = await JobModel.findById(jobId);

            if (!job) {
                throw new Error("Job not found");
            }

            if (job.user_id !== userId) {
                throw new Error("Access denied");
            }

            // Check if job can be cancelled
            const cancelCheck = JobHelper.canCancelJob(job);
            if (!cancelCheck.canCancel) {
                throw new Error(cancelCheck.reason || "Job cannot be cancelled");
            }

            // Remove from queue if pending
            if (job.status === JobStatus.PENDING) {
                this.jobQueue.removeFromQueue(jobId);
            }

            // Update status using status manager
            await JobStatusManger.transitionJobStatus(jobId, JobStatus.FAILED, undefined, "Job cancelled by user", "User cancellation request");

            console.log(`Job ${jobId} cancelled by user ${userId}`);
        } catch (error) {
            console.error("Error cancelling job:", error);
            throw error;
        }
    }

    /**
     * Enhanced job deletion with comprehensive cleanup
     */
    static async deleteJob(jobId: number, userId: number): Promise<void> {
        try {
            const job = await JobModel.findById(jobId);

            if (!job) {
                throw new Error("Job not found");
            }

            if (job.user_id !== userId) {
                throw new Error("Access denied");
            }

            // Validate job before deletion
            const validation = await JobHelper.validateJob(job);
            if (validation.warnings.length > 0) {
                console.warn(`Job ${jobId} deletion warnings:`, validation.warnings);
            }

            // Remove from queue if pending
            if (job.status === JobStatus.PENDING) {
                this.jobQueue.removeFromQueue(jobId);
            }

            // Clean up files
            await this.cleanupJobFiles(job);

            // Clear status history
            JobStatusManger.clearJobStatusHistory(jobId);

            // Delete from database
            await JobModel.delete(jobId);

            console.log(`Job ${jobId} deleted successfully with full cleanup`);
        } catch (error) {
            console.error("Error deleting job:", error);
            throw error;
        }
    }

    /**
     * Enhanced file cleanup with validation
     */
    private static async cleanupJobFiles(job: Job): Promise<void> {
        try {
            const cleanupResults = [];

            // Delete input file if it exists
            if (job.input_file) {
                const inputExists = await FileUtils.fileExists(job.input_file);
                if (inputExists) {
                    const deleted = await FileUtils.deleteFile(job.input_file);
                    cleanupResults.push(`Input file ${deleted ? "deleted" : "failed to delete"}: ${job.input_file}`);
                }
            }

            // Delete output file if exists
            if (job.output_file) {
                const outputExists = await FileUtils.fileExists(job.output_file);
                if (outputExists) {
                    const deleted = await FileUtils.deleteFile(job.output_file);
                    cleanupResults.push(`Output file ${deleted ? "deleted" : "failed to delete"}: ${job.output_file}`);
                }
            }

            if (cleanupResults.length > 0) {
                console.log(`File cleanup for job ${job.id}:`, cleanupResults);
            }
        } catch (error) {
            console.error(`Error cleaning up files for job ${job.id}:`, error);
        }
    }

    /**
     * Enhanced cleanup with monitoring integration
     */
    static async cleanupOldJobs(
        daysOld: number = 30,
        uploadDirectory?: string
    ): Promise<{
        cleanedJobs: number;
        cleanedFiles: string[];
        errors: string[];
    }> {
        try {
            const errors: string[] = [];
            let cleanedJobs = 0;
            let cleanedFiles: string[] = [];

            // Clean up files using FileUtils
            if (uploadDirectory) {
                const hoursOld = daysOld * 24;
                const fileCleanup = await JobMonitor.cleanUpOrphanedFiles(uploadDirectory, false);
                cleanedFiles = fileCleanup.cleaned;
                errors.push(...fileCleanup.errors);
            }

            // TODO: Implement database cleanup for old jobs
            // This would need a new method in JobModel to get jobs by date

            console.log(`Cleanup completed: ${cleanedJobs} jobs, ${cleanedFiles.length} files`);

            return {
                cleanedJobs,
                cleanedFiles,
                errors,
            };
        } catch (error) {
            console.error("Error in enhanced cleanup:", error);
            throw error;
        }
    }

    /**
     * Get comprehensive service statistics
     */
    static async getServiceStatistics(userId?: number) {
        try {
            const queueStats = this.getQueueStats();
            const monitoringStats = await JobMonitor.getMonitoringStats();
            const monitoringStatus = JobMonitor.getMonitoringStatus();

            let userStats = null;
            if (userId) {
                userStats = await JobModel.getJobStats(userId);
            }

            return {
                queue: queueStats,
                monitoring: {
                    ...monitoringStats,
                    status: monitoringStatus,
                },
                user: userStats,
                service: {
                    initialized: this.isInitialized,
                    version: "1.0.0", // Could be dynamic
                },
            };
        } catch (error) {
            console.error("Error getting service statistics:", error);
            throw error;
        }
    }

    /**
     * Health check endpoint for the service
     */
    static async performHealthCheck(): Promise<{
        status: "healthy" | "warning" | "critical";
        details: Record<string, any>;
        timestamp: string;
    }> {
        try {
            const healthChecks = await JobMonitor.runHealthCheck();
            const stuckJobs = await JobMonitor.detectStuckJobs();
            const queueStats = this.getQueueStats();

            const criticalIssues = healthChecks.filter((check) => !check.isHealty).length;
            const stuckJobCount = stuckJobs.length;

            let status: "healthy" | "warning" | "critical" = "healthy";

            if (criticalIssues > 0 || stuckJobCount > 0) {
                status = stuckJobCount > 5 ? "critical" : "warning";
            }

            return {
                status,
                details: {
                    initialized: this.isInitialized,
                    monitoring: JobMonitor.getMonitoringStatus().isRunning,
                    queue: queueStats,
                    healthChecks: healthChecks.length,
                    criticalIssues,
                    stuckJobs: stuckJobCount,
                },
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error("Error performing health check:", error);
            return {
                status: "critical",
                details: { error: error },
                timestamp: new Date().toISOString(),
            };
        }
    }

    // Inherit existing methods from original JobService
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
}
