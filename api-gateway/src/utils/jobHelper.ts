import { Job, JobStatus } from "@/types";
import { FileUtils } from "./file";

export interface JobValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export interface JobMetrics {
    processingTime?: number; // in ms
    fileSize: {
        input: number;
        output: number;
    };
    compressionRatio?: number;
    avgProcessingSpeed?: number; // MB per second
}

export interface JobSummary {
    job: Job;
    metrics: JobMetrics;
    statusHistory: string[];
    healthStatus: "healthy" | "warning" | "critical";
}

export class JobHelper {
    static async validateJob(job: Job): Promise<JobValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            if (!job.id) errors.push("Job ID is required");
            if (!job.user_id) errors.push("User ID is required");
            if (!job.input_file) errors.push("Input file is required");
            if (!job.status) errors.push("Job status is required");

            // Validate status
            if (!Object.values(JobStatus).includes(job.status)) {
                errors.push(`Invalid job status: ${job.status}`);
            }

            // Validate file existence
            if (job.input_file) {
                const inputExists = await FileUtils.fileExists(job.input_file);
                if (!inputExists) {
                    errors.push(`Input file does not exist: ${job.input_file}`);
                }
            }

            // Check output file for completed jobs
            if (job.status === JobStatus.COMPLETED) {
                if (!job.output_file) {
                    errors.push("Completed job must have output file");
                } else {
                    const outputExists = await FileUtils.fileExists(job.output_file);
                    if (!outputExists) {
                        warnings.push(`Output file does not exist: ${job.output_file}`);
                    }
                }
            }

            // Check error message for failed jobs
            if (job.status === JobStatus.FAILED && !job.error_message) {
                warnings.push("Failed job should have error message");
            }

            // Validate dates
            if (job.created_at) {
                const createdDate = new Date(job.created_at);
                if (isNaN(createdDate.getTime())) {
                    errors.push("Invalid created_at date");
                }

                // Check if creation date is in the future
                if (createdDate > new Date()) {
                    errors.push("Job creation date cannot be in the future");
                }
            }

            if (job.completed_at) {
                const completedDate = new Date(job.completed_at);
                if (isNaN(completedDate.getTime())) {
                    errors.push("Invalid completed_at date");
                }

                // Check logical date relationship
                if (job.created_at) {
                    const createdDate = new Date(job.created_at);
                    if (completedDate < createdDate) {
                        errors.push("Completion date cannot be before creation date");
                    }
                }
            }

            return {
                isValid: errors.length === 0,
                errors,
                warnings,
            };
        } catch (error) {
            console.error("Error validating job:", error);
            errors.push(`Validation error: ${error}`);
            return { isValid: false, errors, warnings };
        }
    }

    // Calculate job processing metrics
    static async calculateJobMetrics(job: Job): Promise<JobMetrics> {
        const metrics: JobMetrics = {
            fileSize: {
                input: 0,
                output: 0,
            },
        };

        try {
            // Get file sizes
            if (job.input_file) {
                metrics.fileSize.input = await FileUtils.getFileSize(job.input_file);
            }

            if (job.output_file) {
                metrics.fileSize.output = await FileUtils.getFileSize(job.output_file);
            }

            // Calculate processing time
            if (job.created_at && job.completed_at) {
                const startTime = new Date(job.created_at).getTime();
                const endTime = new Date(job.completed_at).getTime();
                metrics.processingTime = endTime - startTime;

                // Calculate processing speed (MB/second)
                if (metrics.processingTime > 0 && metrics.fileSize.input > 0) {
                    const seconds = metrics.processingTime / 1000;
                    const inputMB = metrics.fileSize.input / (1024 * 1024);
                    metrics.avgProcessingSpeed = inputMB / seconds;
                }
            }

            // Calculate compression ratio
            if (metrics.fileSize.input > 0 && metrics.fileSize.output > 0) {
                metrics.compressionRatio = metrics.fileSize.output / metrics.fileSize.input;
            }

            return metrics;
        } catch (error) {
            console.error("Error calculating job metrics:", error);
            return metrics;
        }
    }

    // Get human-readable job status description

    static getStatusDescription(status: JobStatus): string {
        const descriptions = {
            [JobStatus.PENDING]: "Waiting in queue for processing",
            [JobStatus.PROCESSING]: "Currently being processed",
            [JobStatus.COMPLETED]: "Successfully completed",
            [JobStatus.FAILED]: "Processing failed",
        };

        return descriptions[status] || "Unknown status";
    }

    // Get job age in human-readable format
    static getJobAge(createdAt: string): string {
        const now = new Date();
        const created = new Date(createdAt);
        const diffMs = now.getTime() - created.getTime();

        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
        return `${seconds} second${seconds > 1 ? "s" : ""} ago`;
    }

    static formatFileSize(bytes: number): string {
        if (bytes === 0) return "0 B";

        const units = ["B", "KB", "MB", "GB", "TB"];
        const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
        const size = bytes / Math.pow(1024, unitIndex);

        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    static formatProcessingTime(milliseconds: number): string {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    static determineHealthStatus(job: Job): "healthy" | "warning" | "critical" {
        const now = new Date();
        const created = new Date(job.created_at);
        const hoursAgo = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

        // Critical: Failed jobs or very old stuck jobs
        if (job.status === JobStatus.FAILED) {
            return "critical";
        }

        if (job.status === JobStatus.PROCESSING && hoursAgo > 2) {
            return "critical"; // Processing too long
        }

        if (job.status === JobStatus.PENDING && hoursAgo > 1) {
            return "critical"; // Pending too long
        }

        // Warning: Jobs that are taking longer than expected but not critical yet
        if (job.status === JobStatus.PROCESSING && hoursAgo > 0.5) {
            return "warning"; // Processing for more than 30 minutes
        }

        if (job.status === JobStatus.PENDING && hoursAgo > 0.25) {
            return "warning"; // Pending for more than 15 minutes
        }

        // Healthy: All other cases
        return "healthy";
    }

    static async generateJobSummary(job: Job): Promise<JobSummary> {
        try {
            const metrics = await this.calculateJobMetrics(job);
            const healthStatus = this.determineHealthStatus(job);

            // Generate status history (simplified - in real implementation this would come from database)
            const statusHistory = [`Created: ${this.getJobAge(job.created_at)}`, `Status: ${this.getStatusDescription(job.status)}`];

            if (job.completed_at) {
                statusHistory.push(`Completed: ${this.getJobAge(job.completed_at)}`);
            }

            if (job.error_message) {
                statusHistory.push(`Error: ${job.error_message}`);
            }

            return {
                job,
                metrics,
                statusHistory,
                healthStatus,
            };
        } catch (error) {
            console.error("Error generating job summary:", error);
            throw error;
        }
    }

    static canRetryJob(job: Job): { canRetry: boolean; reason?: string } {
        if (job.status !== JobStatus.FAILED) {
            return { canRetry: false, reason: "Only failed jobs can be retried" };
        }

        //TODO: Check if input file still exists
        // Note: This should be async in real implementation
        return { canRetry: true };
    }

    static canCancelJob(job: Job): { canCancel: boolean; reason?: string } {
        if (job.status === JobStatus.COMPLETED) {
            return { canCancel: false, reason: "Cannot cancel completed job" };
        }

        if (job.status === JobStatus.FAILED) {
            return { canCancel: false, reason: "Cannot cancel already failed job" };
        }

        return { canCancel: true };
    }

    // Get job priority (could be enhanced with actual priority system)
    static getJobPriority(job: Job): "low" | "normal" | "high" {
        // Simple priority based on file size and age
        const now = new Date();
        const created = new Date(job.created_at);
        const hoursAgo = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

        // High priority for old jobs
        if (hoursAgo > 0.5) return "high";

        // High priority for small files (process quickly)
        if (job.file_size && job.file_size < 10 * 1024 * 1024) return "high"; // < 10MB

        // Low priority for very large files
        if (job.file_size && job.file_size > 100 * 1024 * 1024) return "low"; // > 100MB

        return "normal";
    }

    static getProgressMessage(job: Job): string {
        switch (job.status) {
            case JobStatus.PENDING:
                return "Waiting in queue...";
            case JobStatus.PROCESSING:
                return "Processing video...";
            case JobStatus.COMPLETED:
                return "Processing completed successfully";
            case JobStatus.FAILED:
                return job.error_message || "Processing failed";
            default:
                return "Unknown status";
        }
    }

    static sanitizeJobForAPI(job: Job): Partial<Job> {
        // Remove sensitive file paths and just return filename
        const sanitized = { ...job };

        if (sanitized.input_file) {
            sanitized.input_file = sanitized.input_file.split("/").pop() || sanitized.input_file;
        }

        if (sanitized.output_file) {
            sanitized.output_file = sanitized.output_file.split("/").pop() || sanitized.output_file;
        }

        return sanitized;
    }

    static calculateEstimatedCompletion(job: Job): Date | null {
        if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
            return null;
        }

        // Base estimation on file size and current status
        let estimatedMinutes = 0;

        if (job.status === JobStatus.PENDING) {
            estimatedMinutes = 2; // Queue waiting time
        }

        if (job.status === JobStatus.PROCESSING || job.status === JobStatus.PENDING) {
            // Add processing time based on file size
            if (job.file_size) {
                const sizeMB = job.file_size / (1024 * 1024);
                estimatedMinutes += Math.ceil(sizeMB / 10); // 1 minute per 10MB
            } else {
                estimatedMinutes += 5; // Default 5 minutes
            }
        }

        const estimatedTime = new Date();
        estimatedTime.setMinutes(estimatedTime.getMinutes() + estimatedMinutes);
        return estimatedTime;
    }

    static generateDebugInfo(job: Job): Record<string, any> {
        return {
            jobId: job.id,
            userId: job.user_id,
            status: job.status,
            age: this.getJobAge(job.created_at),
            fileSize: job.file_size ? this.formatFileSize(job.file_size) : "Unknown",
            priority: this.getJobPriority(job),
            canRetry: this.canRetryJob(job),
            canCancel: this.canCancelJob(job),
            healthStatus: this.determineHealthStatus(job),
            estimatedCompletion: this.calculateEstimatedCompletion(job),
            progressMessage: this.getProgressMessage(job),
            hasError: !!job.error_message,
            errorMessage: job.error_message,
            hasOutput: !!job.output_file,
            conversionSettings: job.conversion_settings,
            timestamps: {
                created: job.created_at,
                completed: job.completed_at,
            },
        };
    }

    static async batchValidateJobs(jobs: Job[]): Promise<Map<number, JobValidationResult>> {
        const results = new Map<number, JobValidationResult>();

        // Process jobs in parallel for better performance
        const validationPromises = jobs.map(async (job) => {
            const result = await this.validateJob(job);
            return { jobId: job.id, result };
        });

        const validationResults = await Promise.all(validationPromises);

        validationResults.forEach(({ jobId, result }) => {
            results.set(jobId, result);
        });

        return results;
    }
    static getJobListStatistics(jobs: Job[]): {
        total: number;
        byStatus: Record<JobStatus, number>;
        avgFileSize: number;
        totalFileSize: number;
        oldestJob: string;
        newestJob: string;
        healthSummary: Record<string, number>;
    } {
        if (jobs.length === 0) {
            return {
                total: 0,
                byStatus: {
                    [JobStatus.PENDING]: 0,
                    [JobStatus.PROCESSING]: 0,
                    [JobStatus.COMPLETED]: 0,
                    [JobStatus.FAILED]: 0,
                },
                avgFileSize: 0,
                totalFileSize: 0,
                oldestJob: "",
                newestJob: "",
                healthSummary: { healthy: 0, warning: 0, critical: 0 },
            };
        }

        const byStatus = jobs.reduce((acc, job) => {
            acc[job.status] = (acc[job.status] || 0) + 1;
            return acc;
        }, {} as Record<JobStatus, number>);

        // Ensure all statuses are represented
        Object.values(JobStatus).forEach((status) => {
            if (!(status in byStatus)) {
                byStatus[status] = 0;
            }
        });

        const fileSizes = jobs.filter((job) => job.file_size).map((job) => job.file_size!);
        const totalFileSize = fileSizes.reduce((sum, size) => sum + size, 0);
        const avgFileSize = fileSizes.length > 0 ? totalFileSize / fileSizes.length : 0;

        const sortedByDate = [...jobs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        const healthSummary = jobs.reduce(
            (acc, job) => {
                const health = this.determineHealthStatus(job);
                acc[health] = (acc[health] || 0) + 1;
                return acc;
            },
            { healthy: 0, warning: 0, critical: 0 }
        );

        return {
            total: jobs.length,
            byStatus,
            avgFileSize,
            totalFileSize,
            oldestJob: sortedByDate[0]?.created_at || "",
            newestJob: sortedByDate[sortedByDate.length - 1]?.created_at || "",
            healthSummary,
        };
    }
}
