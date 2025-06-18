import { ensureUser } from "@/middlewares/session";
import { JobModel } from "@/models/Job";
import { JobFilters, JobService, PaginationOptions } from "@/services/jobService";
import { JobStatus } from "@/types";
import { Router, Request, Response } from "express";

const router = Router();

// GET /api/jobs/:id = get specific job details
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

        const job = await JobModel.findById(jobId);

        if (!job) {
            res.status(404).json({
                success: false,
                error: "Job not found",
                code: "JOB_NOT_FOUND",
            });
            return;
        }

        // Check if user owns this job
        if (job.user_id !== req.session.userId) {
            res.status(403).json({
                success: false,
                error: "Access denied",
                code: "ACCESS_DENIED",
            });
            return;
        }

        // Add queue information
        const isInQueue = JobService.isJobProcessing(jobId);
        const queueStats = JobService.getQueueStats();

        res.json({
            success: true,
            job: {
                id: job.id,
                status: job.status,
                input_file: job.input_file,
                output_file: job.output_file,
                error_message: job.error_message,
                created_at: job.created_at,
                completed_at: job.completed_at,
                file_size: job.file_size,
                conversion_settings: job.conversion_settings,
                // Additional queue info
                is_processing: isInQueue,
                queue_position: job.status === JobStatus.PENDING ? "In queue" : null,
            },
            queue: queueStats,
        });
    } catch (error) {
        console.error("Error fetching job details:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch job details",
            code: "FETCH_ERROR",
        });
    }
});

// GET /api/jobs - Get user's jobs with pagination and filtering
router.get("/", ensureUser, async (req: Request, res: Response) => {
    try {
        // Parse pagination parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Max 50 items per page

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

        // Get filtered and paginated jobs
        const result = await JobService.getUserJobs(req.session.userId!, filters, pagination);

        // Add queue information to response
        const queueStats = JobService.getQueueStats();

        res.json({
            success: true,
            ...result,
            queue: queueStats,
            filters: filters, // Echo back applied filters
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

// POST /api/jobs/:id/retry - Retry failed job
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

        const retriedJob = await JobService.retryJob(jobId, req.session.userId!);

        res.json({
            success: true,
            message: "Job queued for retry",
            job: {
                id: retriedJob.id,
                status: retriedJob.status,
                created_at: retriedJob.created_at,
                input_file: retriedJob.input_file,
            },
            queue: JobService.getQueueStats(),
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

            if (error.message === "Only failed jobs can be retried") {
                res.status(400).json({
                    success: false,
                    error: "Only failed jobs can be retried",
                    code: "INVALID_STATUS",
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

// POST /api/jobs/:id/cancel - Cancel job
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

        await JobService.cancelJob(jobId, req.session.userId!);

        res.json({
            success: true,
            message: "Job cancelled successfully",
            queue: JobService.getQueueStats(),
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

            if (error.message === "Cannot cancel completed job") {
                res.status(400).json({
                    success: false,
                    error: "Cannot cancel completed job",
                    code: "INVALID_STATUS",
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

// DELETE /api/jobs/:id - Delete job and associated files
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

        await JobService.deleteJob(jobId, req.session.userId!);

        res.json({
            success: true,
            message: "Job deleted successfully",
            queue: JobService.getQueueStats(),
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

// GET /api/jobs/stats - Get user's job statistics dashboard
router.get("/stats", ensureUser, async (req: Request, res: Response) => {
    try {
        const stats = await JobService.getUserJobsWithQueueInfo(req.session.userId!);

        // Get recent jobs for quick overview
        const recentJobs = await JobService.getUserJobs(req.session.userId!, {}, { page: 1, limit: 5 });

        res.json({
            success: true,
            stats: {
                total: stats.total,
                pending: stats.pending,
                processing: stats.processing,
                completed: stats.completed,
                failed: stats.failed,
                queue: stats.queue,
            },
            recentJobs: recentJobs.jobs.map((job) => ({
                id: job.id,
                status: job.status,
                input_file: job.input_file,
                created_at: job.created_at,
                completed_at: job.completed_at,
            })),
        });
    } catch (error) {
        console.error("Error fetching job statistics:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch job statistics",
            code: "STATS_ERROR",
        });
    }
});

// GET /api/jobs/queue/status - Get current queue status
router.get("/queue/status", ensureUser, async (req: Request, res: Response) => {
    try {
        const queueStats = JobService.getQueueStats();
        const nextJob = JobService.getNextJobInQueue();

        res.json({
            success: true,
            queue: {
                ...queueStats,
                nextJobId: nextJob,
            },
        });
    } catch (error) {
        console.error("Error fetching queue status:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch queue status",
            code: "QUEUE_ERROR",
        });
    }
});

export default router;
