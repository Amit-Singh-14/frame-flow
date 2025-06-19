import { JobModel } from "@/models/Job";
import { Job, JobStatus } from "@/types";
import { FileUtils } from "@/utils/file";
import { JobStatusManger } from "./jobStatusManger";

export interface JobHealtCheck {
    jobId: number;
    status: JobStatus;
    isHealty: boolean;
    issues: string[];
    lastChecked: string;
}

export interface MonitoringStats {
    totalJobs: number;
    healtyJobs: number;
    unhealtyJobs: number;
    stuckJobs: number;
    orphanedFiles: number;
    lastMonitorRun: string;
}

export class JobMonitor {
    private static readonly PROCESSING_TIMEOUT_HOURS = 2;
    private static readonly PENDING_TIMEOUT_HOURS = 2;
    private static readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000;

    private static isMonitoring = false;
    private static monitoringInterval: NodeJS.Timeout | null = null;
    private static lastMonitorRun: Date = new Date();

    static startMonitoring(): void {
        if (this.isMonitoring) {
            console.log("Job monitoring is already running");
            return;
        }

        console.log("Starting job monitoring service...");
        this.isMonitoring = true;
        // Run initial health check
        this.runHealthCheck().catch((err) => console.error("Error in initial health check:", err));

        // Set up periodic monitoring
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.runHealthCheck();
            } catch (error) {
                console.error("Error in periodic health check:", error);
                // clearInterval(this.monitoringInterval || "");
            }
        }, this.HEALTH_CHECK_INTERVAL);

        console.log(`Job monitoring started with ${this.HEALTH_CHECK_INTERVAL / 1000}s interval`);
    }

    static async runHealthCheck(): Promise<JobHealtCheck[]> {
        try {
            console.log("Running job health check...");
            this.lastMonitorRun = new Date();

            // get all non-completed jobs for health check
            const pendingJobs = await JobModel.findPendingJobs();
            // TODO: add method to get processing job

            const healthChecks: JobHealtCheck[] = [];

            for (const job of pendingJobs) {
                const healthCheck = await this.checkJobHealth(job);
                healthChecks.push(healthCheck);

                if (!healthCheck.isHealty) {
                    await this.handleUnhealthyJob(job, healthCheck.issues);
                }
            }

            // check for orphaned files
            // await this.checkForOrphanedFiles();

            console.log(`Health check completed. Checked ${healthChecks.length} jobs`);
            return healthChecks;
        } catch (error) {
            console.error("Error running health check:", error);
            throw error;
        }
    }

    static async checkJobHealth(job: Job): Promise<JobHealtCheck> {
        const issues: string[] = [];
        const now = new Date();
        const createdTime = new Date(job.created_at);
        const hoursAgo = (now.getTime() - createdTime.getTime()) / (1000 * 60 * 60);

        // check for stuck pending jobs
        if (job.status === JobStatus.PENDING && hoursAgo > this.PENDING_TIMEOUT_HOURS) {
            issues.push(`Job has been pending for ${hoursAgo.toFixed(1)} hours (timeout: ${this.PENDING_TIMEOUT_HOURS}h)`);
        }

        // check for stuck processing jobs
        if (job.status === JobStatus.PROCESSING && hoursAgo > this.PROCESSING_TIMEOUT_HOURS) {
            issues.push(`Job has been processing for ${hoursAgo.toFixed(1)} hours (timeout: ${this.PROCESSING_TIMEOUT_HOURS}h)`);
        }

        // check if input file exists
        if (job.input_file) {
            // const inputExists = await FileUtils.fileExists(job.input_file);
            //  if (!inputExists) {
            //     issues.push(`Input file does not exist: ${job.input_file}`);
            // }
        }

        // Check if output file exists for completed jobs
        if (job.status === JobStatus.COMPLETED && job.output_file) {
            // const outputExists = await FileUtils.fileExists(job.output_file);
            // if (!outputExists) {
            //     issues.push(`Output file missing for completed job: ${job.output_file}`);
            // }
        }

        return {
            jobId: job.id,
            status: job.status,
            isHealty: issues.length === 0,
            issues,
            lastChecked: now.toISOString(),
        };
    }

    private static async handleUnhealthyJob(job: Job, issues: string[]): Promise<void> {
        try {
            console.log(`Handling unhealthy job ${job.id}:`, issues);

            // handle stuck jobs
            const isStuck = issues.some((issue) => issue.includes("pending for") || issue.includes("processing for"));

            if (isStuck) {
                await JobStatusManger.transitionJobStatus(
                    job.id,
                    JobStatus.FAILED,
                    undefined,
                    `Job timed out: ${issues.join("; ")}`,
                    "Monitor: timeout detected"
                );
            }

            // handle missing input files
            const handleMissingInput = issues.some((issue) => issue.includes("Input file does not exist"));

            if (handleMissingInput) {
                await JobStatusManger.transitionJobStatus(
                    job.id,
                    JobStatus.FAILED,
                    undefined,
                    "Input file is missing or corrupted",
                    "Monitor: missing input file"
                );
                console.log(`Marked job ${job.id} as failed due to missing input file`);
            }
        } catch (error) {
            console.error(`Error handling unhealthy job ${job.id}:`, error);
        }
    }

    // detect stuck jobs that need intervation
    static async detectStuckJobs(): Promise<Job[]> {
        try {
            const stuckJobs: Job[] = [];
            const pendingJobs = await JobModel.findPendingJobs();

            const now = new Date();

            for (const job of pendingJobs) {
                const createdTime = new Date(job.created_at);
                const hoursAgo = (now.getTime() - createdTime.getTime()) / (1000 * 60 * 60);

                const isStuck =
                    (job.status === JobStatus.PENDING && hoursAgo > this.PENDING_TIMEOUT_HOURS) ||
                    (job.status === JobStatus.PROCESSING && hoursAgo > this.PROCESSING_TIMEOUT_HOURS);

                if (isStuck) {
                    stuckJobs.push(job);
                }
            }

            return stuckJobs;
        } catch (error) {
            console.error("Error detecting stuck jobs:", error);
            throw error;
        }
    }

    // check for orphaned files (files without corresponding jobs)
    static async checkForOrphanedFiles(uploadDir?: string): Promise<string[]> {
        if (!uploadDir) {
            return [];
        }
        try {
            // const allFiles = await FileUtils.getFilesInDirectory(uploadDir);
            const orphanedFiles: string[] = [];

            // TODO:  Get all job files from database
            // This would need a method to get all job files from JobModel
            // For now, we'll return empty array as placeholder

            // console.log(`Checked ${allFiles.length} files for orphans`);
            console.log(`checked orphaned files`);
            return orphanedFiles;
        } catch (error) {
            console.error("Error checking for orphaned files:", error);
            throw error;
        }
    }

    static async cleanUpOrphanedFiles(
        uploadDir: string,
        dryrun: boolean = true
    ): Promise<{
        cleaned: string[];
        errors: string[];
    }> {
        const cleaned: string[] = [];
        const errors: string[] = [];

        try {
            const orphanedFiles = await this.checkForOrphanedFiles(uploadDir);

            for (const filePath of orphanedFiles) {
                try {
                    if (!dryrun) {
                        const deleted = await FileUtils.deleteFile(filePath);

                        if (deleted) {
                            cleaned.push(filePath);
                            console.log(`Deleted orphaned file: ${filePath}`);
                        }
                    } else {
                        console.log(`[DRY RUN] Would delete orphaned file: ${filePath}`);
                        cleaned.push(filePath);
                    }
                } catch (fileError) {
                    const errorMsg = `Failed to delete ${filePath}: ${fileError}`;
                    errors.push(errorMsg);
                    console.error(errorMsg);
                }
            }
        } catch (error) {
            console.error("Error cleaning up orphaned files:", error);
            throw error;
        }

        return { cleaned, errors };
    }

    static async getMonitoringStats(): Promise<MonitoringStats> {
        try {
            // TODO: this would need toe be enhanced with actual jon counting by status
            // for now its a basic implementation

            const pendingJobs = await JobModel.findPendingJobs();
            const stuckJobs = await this.detectStuckJobs();

            return {
                totalJobs: pendingJobs.length,
                healtyJobs: pendingJobs.length - stuckJobs.length,
                unhealtyJobs: stuckJobs.length,
                stuckJobs: stuckJobs.length,
                orphanedFiles: 0,
                lastMonitorRun: this.lastMonitorRun.toISOString(),
            };
        } catch (error) {
            console.error("Error getting monitoring stats:", error);
            throw error;
        }
    }

    static async forceCleanupStuckJobs(): Promise<{ cleaned: number; errors: string[] }> {
        const errors: string[] = [];
        let cleaned = 0;

        try {
            const stuckJobs = await this.detectStuckJobs();

            for (const job of stuckJobs) {
                try {
                    await JobStatusManger.transitionJobStatus(
                        job.id,
                        JobStatus.FAILED,
                        undefined,
                        "Job force-cleaned by monitor",
                        "Monitor: force cleanup"
                    );
                    cleaned++;
                    console.log(`Force-cleaned stuck job ${job.id}`);
                } catch (jobError) {
                    const errorMsg = `Failed to clean job ${job.id}: ${jobError}`;
                    errors.push(errorMsg);
                    console.error(errorMsg);
                }
            }
        } catch (error) {
            console.error("Error in force cleanup:", error);
            throw error;
        }

        return { cleaned, errors };
    }

    // Get current monitoring status
    static getMonitoringStatus(): {
        isRunning: boolean;
        intervalMs: number;
        lastRun: string;
        nextRun: string;
    } {
        const nextRun = new Date(this.lastMonitorRun.getTime() + this.HEALTH_CHECK_INTERVAL);

        return {
            isRunning: this.isMonitoring,
            intervalMs: this.HEALTH_CHECK_INTERVAL,
            lastRun: this.lastMonitorRun.toISOString(),
            nextRun: nextRun.toISOString(),
        };
    }
}
