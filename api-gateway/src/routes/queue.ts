import { jobService } from "@/services/jobService";
import { redisQueueService } from "@/services/redisQueueService";
import express from "express";

const router = express.Router();

/**
 * GET /api/queue/next - Get next job from queue
 * This is the main endpoint your Go backend will use
 */
router.get("/next", async (req, res) => {
    try {
        const jobId = await redisQueueService.getNextJob();

        if (!jobId) {
            res.status(204).json({ message: "No jobs in queue" });
            return;
        }
        console.log("queue", jobId);

        // Get full job details from database
        const job = await jobService.getById(jobId);

        if (!job) {
            // job not found in database, remove from queue
            await redisQueueService.removeJob(jobId);
            res.status(404).json({ error: "Job not found in database" });
            return;
        }

        // update job status
        await jobService.startJob(jobId, (req.header("worker-id") as string) || "unknown");

        res.json({
            success: true,
            job: {
                id: job.id,
                user_id: job.user_id,
                video_id: job.video_id,
                title: job.title,
                job_type: job.job_type,
                conversion_settings: job.conversion_settings,
                tags: job.tags,
                priority: job.priority,
                retry_count: job.retry_count,
                created_at: job.created_at,
                input_file: job.file_name,
            },
        });
        return;
    } catch (error) {
        console.error("Error getting next job:", error);
        res.status(500).json({ error: "Failed to get next job" });
    }
});

/**
 * POST /api/queue/complete/:jobId - Mark job as completed
 */
router.post("/complete/:jobId", async (req, res) => {
    try {
        const jobId = parseInt(req.params.jobId);
        const { output_file, preview_url, thumbnail_url } = req.body;
        console.log(req.body);

        if (!output_file) {
            res.status(400).json({
                error: "output_file is required",
            });
            return;
        }

        // updated job in database
        await jobService.completeJob(jobId, output_file, { previewUrl: preview_url, thumbnailUrl: thumbnail_url });

        // update jon in redis queue
        await redisQueueService.completedJob(jobId);

        res.json({
            success: true,
            message: "Job completed successfully",
        });
    } catch (error) {
        console.error("Error completing job:", error);
        res.status(500).json({
            error: "Failed to complete job",
        });
    }
});

/**
 * POST /api/queue/fail/:jobId - Mark job as failed
 */
router.post("/fail/:jobId", async (req, res) => {
    try {
        const jobId = parseInt(req.params.jobId);
        const { errorMessage, errorCode, errorRetriable } = req.body;
        console.log(req.body);

        if (!errorMessage) {
            res.status(400).json({
                error: "errorMessage is required",
            });
            return;
        }

        // update job in database
        await jobService.failJob(jobId, errorMessage, errorCode, errorRetriable);

        // update job in redis queue
        await redisQueueService.failJob(jobId, errorMessage);

        res.json({
            success: true,
            message: "Job marked as failed",
        });
    } catch (error) {
        console.error("Error failing job:", error);
        res.status(500).json({ error: "Failed to fail job" });
    }
});

/**
 * POST /api/queue/progress/:jobId - Update job progress
 */
router.post("/progress/:jobId", async (req, res) => {
    try {
        const jobId = parseInt(req.params.jobId);
        const { status, status_description } = req.body;
        console.log(jobId, status, status_description, req.body);

        if (!status || !status_description) {
            res.status(400).json({
                error: "healthStatus and statusDescription are required",
            });
            return;
        }

        // update job progress in database
        await jobService.updateJobProgress(jobId, status, status_description);

        res.json({
            success: true,
            message: "Job progress updated",
        });
        return;
    } catch (error) {
        console.error("Error updating job progress:", error);
        res.status(500).json({ error: "Failed to update job progress" });
    }
});

/**
 * GET /api/queue/stats - Get queue statistics
 */
router.get("/stats", async (req, res) => {
    try {
        const stats = await redisQueueService.getQueueStats();
        res.json({
            success: true,
            stats,
        });
        return;
    } catch (error) {
        console.error("Error getting queue stats:", error);
        res.status(500).json({ error: "Failed to get queue statistics" });
    }
});

/**
 * GET /api/queue/jobs - Get all queued jobs
 */
router.get("/jobs", async (req, res) => {
    try {
        const queuedJobs = await redisQueueService.getQueuedJobs();
        const processingJobs = await redisQueueService.getProcessingJobs();

        res.json({
            success: true,
            data: {
                queued: queuedJobs,
                processing: processingJobs,
            },
        });
        return;
    } catch (error) {
        console.error("Error getting queue jobs:", error);
        res.status(500).json({ error: "Failed to get queue jobs" });
    }
});

/**
 * POST /api/queue/retry/:jobId - Retry a failed job
 */
router.post("/retry/:jobId", async (req, res) => {
    try {
        const jobId = parseInt(req.params.jobId);

        // Use the job service retry method which handles database updates
        await jobService.retryJob(jobId);

        res.json({
            success: true,
            message: "Job queued for retry",
        });
        return;
    } catch (error) {
        console.error("Error retrying job:", error);
        res.status(500).json({ error: "Failed to retry job" });
    }
});

/**
 * DELETE /api/queue/clear - Clear all jobs from queue (admin only)
 */
router.delete("/clear", async (req, res) => {
    try {
        await redisQueueService.clearQueue();
        res.json({ success: true, message: "Queue cleared successfully" });
    } catch (error) {
        console.error("Error clearing queue:", error);
        res.status(500).json({ error: "Failed to clear queue" });
    }
});

/**
 * GET /api/queue/health - Health check for queue service
 */
router.get("/health", async (req, res) => {
    try {
        const isHealthy = await redisQueueService.healthCheck();

        if (isHealthy) {
            res.json({ success: true, status: "healthy" });
        } else {
            res.status(503).json({ success: false, status: "unhealthy" });
        }
    } catch (error) {
        console.error("Error checking queue health:", error);
        res.status(503).json({ success: false, status: "unhealthy" });
    }
});

router.post("/add/:jobid", async (req, res) => {
    const jobId = parseInt(req.params.jobid);
    await redisQueueService.clearQueue();
    await redisQueueService.addJob(jobId);
    res.json({
        message: "added to queue",
    });
});
export default router;
