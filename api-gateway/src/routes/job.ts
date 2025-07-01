import { ensureUser } from "@/middlewares/session";
import { JobModel } from "@/models/Job";
import { EnhancedJobService, JobFilters, PaginationOptions } from "@/services/jobService";
import { JobMonitor } from "@/services/jobMonitor";
import { JobStatusManger } from "@/services/jobStatusManger";
import { JobHelper } from "@/utils/jobHelper";
import { JobStatus } from "@/types";
import { Router, Request, Response } from "express";

const router = Router();

// GET /api/jobs - Get user's jobs with enhanced filtering, pagination and statistics
router.get("/", ensureUser, async (req: Request, res: Response) => {
    try {
        // Parse pagination parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
        const pagination: PaginationOptions = { page, limit };

        // Parse filter parameters
        const filters: JobFilters = {};

        if (req.query.status && Object.values(JobStatus).includes(req.query.status as JobStatus)) {
            filters.status = req.query.status as JobStatus;
        }

        if (req.query.startDate) {
            filters.startDate = req.query.startDate as string;
        }

        if (req.query.endDate) {
            filters.endDate = req.query.endDate as string;
        }

        if (req.query.search) {
            filters.search = req.query.search as string;
        }

        // Get enhanced job list with statistics
        const result = await EnhancedJobService.getUserJobs(req.session.userId!, filters, pagination);

        // Add monitoring information
        const queueStats = EnhancedJobService.getQueueStats();

        res.json({
            success: true,
            jobs: result.jobs.map((job) => ({
                ...JobHelper.sanitizeJobForAPI(job),
                age: JobHelper.getJobAge(job.created_at),
                statusDescription: JobHelper.getStatusDescription(job.status),
                healthStatus: JobHelper.determineHealthStatus(job),
                formattedFileSize: JobHelper.formatFileSize(job.file_size || 0),
            })),
            pagination: result.pagination,
            statistics: result.statistics,
            queue: queueStats,
            filters: filters,
        });
    } catch (error) {
        console.error("Error fetching user jobs:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch jobs",
            code: "FETCH_ERROR",
        });
    }
});

// GET /api/jobs/stats - Enhanced user statistics with health monitoring
router.get("/stats", ensureUser, async (req: Request, res: Response) => {
    try {
        // Get enhanced service statistics
        const serviceStats = await EnhancedJobService.getServiceStatistics(req.session.userId!);

        // Get monitoring statistics
        const monitoringStats = await JobMonitor.getMonitoringStats();

        // Get recent jobs with enhanced info
        const recentJobs = await EnhancedJobService.getUserJobs(req.session.userId!, {}, { page: 1, limit: 5 });

        // Get jobs with status details
        const jobsWithDetails = await JobStatusManger.getJobsWithStatusDetails(req.session.userId!);

        res.json({
            success: true,
            stats: {
                ...serviceStats,
                monitoring: {
                    totalJobs: monitoringStats.totalJobs,
                    healthyJobs: monitoringStats.healtyJobs,
                    unhealthyJobs: monitoringStats.unhealtyJobs,
                    stuckJobs: monitoringStats.stuckJobs,
                    orphanedFiles: monitoringStats.orphanedFiles,
                    lastMonitorRun: monitoringStats.lastMonitorRun,
                },
            },
            recentJobs: recentJobs.jobs.map((job) => ({
                ...JobHelper.sanitizeJobForAPI(job),
                age: JobHelper.getJobAge(job.created_at),
                statusDescription: JobHelper.getStatusDescription(job.status),
                healthStatus: JobHelper.determineHealthStatus(job),
                formattedFileSize: JobHelper.formatFileSize(job.file_size || 0),
            })),
            jobsWithDetails: jobsWithDetails.slice(0, 10), // Latest 10 with full details
        });
    } catch (error) {
        console.error("Error fetching enhanced job statistics:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch job statistics",
            code: "STATS_ERROR",
        });
    }
});

// GET /api/jobs/queue/status - Enhanced queue status with monitoring
router.get("/queue/status", ensureUser, async (req: Request, res: Response) => {
    try {
        const queueStats = EnhancedJobService.getQueueStats();
        const nextJob = EnhancedJobService.getNextJobInQueue();
        const monitoringStatus = JobMonitor.getMonitoringStatus();

        res.json({
            success: true,
            queue: {
                ...queueStats,
                nextJobId: nextJob,
            },
            monitoring: monitoringStatus,
        });
    } catch (error) {
        console.error("Error fetching enhanced queue status:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch queue status",
            code: "QUEUE_ERROR",
        });
    }
});

// NEW ENDPOINTS FOR ENHANCED MONITORING

// GET /api/jobs/health/check - Run health check on user's jobs
router.get("/health/check", ensureUser, async (req: Request, res: Response) => {
    try {
        const healthChecks = await JobMonitor.runHealthCheck();

        // Filter for user's jobs only
        const userJobs = await JobModel.findByUserId(req.session.userId!);
        const userJobIds = userJobs.map((job) => job.id);
        const userHealthChecks = healthChecks.filter((check) => userJobIds.includes(check.jobId));

        res.json({
            success: true,
            healthChecks: userHealthChecks,
            summary: {
                total: userHealthChecks.length,
                healthy: userHealthChecks.filter((check) => check.isHealty).length,
                unhealthy: userHealthChecks.filter((check) => !check.isHealty).length,
            },
        });
    } catch (error) {
        console.error("Error running health check:", error);
        res.status(500).json({
            success: false,
            error: "Failed to run health check",
            code: "HEALTH_CHECK_ERROR",
        });
    }
});

// POST /api/jobs/cleanup/old - Cleanup old jobs (admin-like feature for users)
router.post("/cleanup/old", ensureUser, async (req: Request, res: Response) => {
    try {
        const daysOld = parseInt(req.body.daysOld) || 30;
        const uploadDirectory = req.body.uploadDirectory;

        const cleanupResult = await EnhancedJobService.cleanupOldJobs(daysOld, uploadDirectory);

        res.json({
            success: true,
            message: "Cleanup completed successfully",
            result: cleanupResult,
        });
    } catch (error) {
        console.error("Error during cleanup:", error);
        res.status(500).json({
            success: false,
            error: "Failed to cleanup old jobs",
            code: "CLEANUP_ERROR",
        });
    }
});

// GET /api/jobs/health/service - Get overall service health
router.get("/health/service", ensureUser, async (req: Request, res: Response) => {
    try {
        const healthCheck = await EnhancedJobService.performHealthCheck();

        res.json({
            success: true,
            health: healthCheck,
        });
    } catch (error) {
        console.error("Error checking service health:", error);
        res.status(500).json({
            success: false,
            error: "Failed to check service health",
            code: "SERVICE_HEALTH_ERROR",
        });
    }
});

// POST /api/jobs/monitoring/start - Start monitoring (if not already running)
router.post("/monitoring/start", ensureUser, async (req: Request, res: Response) => {
    try {
        JobMonitor.startMonitoring();
        const status = JobMonitor.getMonitoringStatus();

        res.json({
            success: true,
            message: "Job monitoring started",
            status,
        });
    } catch (error) {
        console.error("Error starting monitoring:", error);
        res.status(500).json({
            success: false,
            error: "Failed to start monitoring",
            code: "MONITORING_START_ERROR",
        });
    }
});

// POST /api/jobs/monitoring/stop - Stop monitoring
router.post("/monitoring/stop", ensureUser, async (req: Request, res: Response) => {
    try {
        JobMonitor.stopMonitoring();
        const status = JobMonitor.getMonitoringStatus();

        res.json({
            success: true,
            message: "Job monitoring stopped",
            status,
        });
    } catch (error) {
        console.error("Error stopping monitoring:", error);
        res.status(500).json({
            success: false,
            error: "Failed to stop monitoring",
            code: "MONITORING_STOP_ERROR",
        });
    }
});

// GET /api/jobs/:id - Get enhanced job details with status history and health info
router.get("/:id", ensureUser, async (req: Request, res: Response) => {
    try {
        const jobId = parseInt(req.params.id);
        if (isNaN(jobId)) {
            res.status(400).json({
                success: false,
                error: "Invalid job ID",
                code: "INVALID_JOB_ID",
            });
            return;
        }

        // Get enhanced job details with all monitoring info
        const enhancedJob = await EnhancedJobService.getEnhancedJobDetails(jobId, req.session.userId!);

        // Get additional health check info
        const job = await JobModel.findById(jobId);
        if (!job) {
            res.status(404).json({
                success: false,
                error: "Job not found",
                code: "JOB_NOT_FOUND",
            });
            return;
        }

        // Check ownership
        if (job.user_id !== req.session.userId) {
            res.status(403).json({
                success: false,
                error: "Access denied",
                code: "ACCESS_DENIED",
            });
            return;
        }

        // Get job health check
        const healthCheck = await JobMonitor.checkJobHealth(job);

        // Get retry/cancel capabilities
        const retryInfo = JobHelper.canRetryJob(job);
        const cancelInfo = JobHelper.canCancelJob(job);

        res.json({
            success: true,
            job: {
                ...enhancedJob.job,
                // Enhanced information
                statusHistory: enhancedJob.statusHistory,
                estimatedCompletion: enhancedJob.estimatedCompletion,
                progress: enhancedJob.progress,
                progressMessage: JobHelper.getProgressMessage(job),
                healthStatus: enhancedJob.healthStatus,
                canRetry: enhancedJob.canRetry,
                canCancel: enhancedJob.canCancel,
                metrics: enhancedJob.metrics,
                // Health check info
                healthCheck: {
                    isHealthy: healthCheck.isHealty,
                    issues: healthCheck.issues,
                    lastChecked: healthCheck.lastChecked,
                },
                // Additional helper info
                age: JobHelper.getJobAge(job.created_at),
                statusDescription: JobHelper.getStatusDescription(job.status),
                priority: JobHelper.getJobPriority(job),
            },
            queue: EnhancedJobService.getQueueStats(),
        });
    } catch (error) {
        console.error("Error fetching enhanced job details:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch job details",
            code: "FETCH_ERROR",
        });
    }
});

// DELETE /api/jobs/:id - Delete job with enhanced cleanup
router.delete("/:id", ensureUser, async (req: Request, res: Response) => {
    try {
        const jobId = parseInt(req.params.id);

        if (isNaN(jobId)) {
            res.status(400).json({
                success: false,
                error: "Invalid job ID",
                code: "INVALID_JOB_ID",
            });
            return;
        }

        await EnhancedJobService.deleteJob(jobId, req.session.userId!);

        res.json({
            success: true,
            message: "Job deleted successfully",
            queue: EnhancedJobService.getQueueStats(),
        });
    } catch (error) {
        console.error("Error deleting job:", error);

        if (error instanceof Error) {
            if (error.message === "Job not found") {
                res.status(404).json({
                    success: false,
                    error: "Job not found",
                    code: "JOB_NOT_FOUND",
                });
                return;
            }

            if (error.message === "Access denied") {
                res.status(403).json({
                    success: false,
                    error: "Access denied",
                    code: "ACCESS_DENIED",
                });
                return;
            }
        }

        res.status(500).json({
            success: false,
            error: "Failed to delete job",
            code: "DELETE_ERROR",
        });
    }
});

// POST /api/jobs/:id/retry - Retry failed job with enhanced validation
router.post("/:id/retry", ensureUser, async (req: Request, res: Response) => {
    try {
        const jobId = parseInt(req.params.id);

        if (isNaN(jobId)) {
            res.status(400).json({
                success: false,
                error: "Invalid job ID",
                code: "INVALID_JOB_ID",
            });
            return;
        }

        // Check if job can be retried using helper
        const job = await JobModel.findById(jobId);
        if (!job) {
            res.status(404).json({
                success: false,
                error: "Job not found",
                code: "JOB_NOT_FOUND",
            });
            return;
        }

        const retryCheck = JobHelper.canRetryJob(job);
        if (!retryCheck.canRetry) {
            res.status(400).json({
                success: false,
                error: retryCheck.reason || "Job cannot be retried",
                code: "CANNOT_RETRY",
            });
            return;
        }

        const retriedJob = await EnhancedJobService.retryJob(jobId, req.session.userId!);

        res.json({
            success: true,
            message: "Job queued for retry",
            job: {
                ...JobHelper.sanitizeJobForAPI(retriedJob),
                statusDescription: JobHelper.getStatusDescription(retriedJob.status),
                age: JobHelper.getJobAge(retriedJob.created_at),
            },
            queue: EnhancedJobService.getQueueStats(),
        });
    } catch (error) {
        console.error("Error retrying job:", error);

        if (error instanceof Error) {
            if (error.message === "Job not found") {
                res.status(404).json({
                    success: false,
                    error: "Job not found",
                    code: "JOB_NOT_FOUND",
                });
                return;
            }

            if (error.message === "Access denied") {
                res.status(403).json({
                    success: false,
                    error: "Access denied",
                    code: "ACCESS_DENIED",
                });
                return;
            }
        }

        res.status(500).json({
            success: false,
            error: "Failed to retry job",
            code: "RETRY_ERROR",
        });
    }
});

// POST /api/jobs/:id/cancel - Cancel job with enhanced validation
router.post("/:id/cancel", ensureUser, async (req: Request, res: Response) => {
    try {
        const jobId = parseInt(req.params.id);

        if (isNaN(jobId)) {
            res.status(400).json({
                success: false,
                error: "Invalid job ID",
                code: "INVALID_JOB_ID",
            });
            return;
        }

        // Check if job can be cancelled using helper
        const job = await JobModel.findById(jobId);
        if (!job) {
            res.status(404).json({
                success: false,
                error: "Job not found",
                code: "JOB_NOT_FOUND",
            });
            return;
        }

        const cancelCheck = JobHelper.canCancelJob(job);
        if (!cancelCheck.canCancel) {
            res.status(400).json({
                success: false,
                error: cancelCheck.reason || "Job cannot be cancelled",
                code: "CANNOT_CANCEL",
            });
            return;
        }

        await EnhancedJobService.cancelJob(jobId, req.session.userId!);

        res.json({
            success: true,
            message: "Job cancelled successfully",
            queue: EnhancedJobService.getQueueStats(),
        });
    } catch (error) {
        console.error("Error cancelling job:", error);

        if (error instanceof Error) {
            if (error.message === "Job not found") {
                res.status(404).json({
                    success: false,
                    error: "Job not found",
                    code: "JOB_NOT_FOUND",
                });
                return;
            }

            if (error.message === "Access denied") {
                res.status(403).json({
                    success: false,
                    error: "Access denied",
                    code: "ACCESS_DENIED",
                });
                return;
            }
        }

        res.status(500).json({
            success: false,
            error: "Failed to cancel job",
            code: "CANCEL_ERROR",
        });
    }
});

// GET /api/jobs/:id/status/history - Get job status history
router.get("/:id/status/history", ensureUser, async (req: Request, res: Response) => {
    try {
        const jobId = parseInt(req.params.id);
        if (isNaN(jobId)) {
            res.status(400).json({
                success: false,
                error: "Invalid job ID",
                code: "INVALID_JOB_ID",
            });
            return;
        }

        // Verify job ownership
        const job = await JobModel.findById(jobId);
        if (!job) {
            res.status(404).json({
                success: false,
                error: "Job not found",
                code: "JOB_NOT_FOUND",
            });
            return;
        }

        if (job.user_id !== req.session.userId) {
            res.status(403).json({
                success: false,
                error: "Access denied",
                code: "ACCESS_DENIED",
            });
            return;
        }

        const statusHistory = JobStatusManger.getJobStatusHistory(jobId);
        const estimatedCompletion = JobStatusManger.calculateEstimationTime(job);
        const progress = JobStatusManger.getJobProgress(job);

        res.json({
            success: true,
            jobId,
            statusHistory,
            estimatedCompletion,
            progress,
            currentStatus: job.status,
            statusDescription: JobHelper.getStatusDescription(job.status),
        });
    } catch (error) {
        console.error("Error fetching job status history:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch status history",
            code: "STATUS_HISTORY_ERROR",
        });
    }
});

export default router;
