import { Request, Response } from "express";
import { jobService } from "../services/jobService";
import { Router } from "express";
import { ensureUser } from "@/middlewares/session";
import { db } from "@/database/connection";
import { FileUtils } from "@/utils/file";
import { FrontendJob, Job, JobError } from "@/types/job";
import { calculateAge, generateProgressSteps, getDefaultHealthStatus, getDefaultStatusDescription, getJobActions } from "@/helpers";

interface JobsQueryParams {
    page?: string;
    limit?: string;
    status?: Job["status"];
    title?: string;
    file_name?: string;
    sort_by?: "created_at" | "updated_at" | "priority" | "status";
    sort_order?: "asc" | "desc";
}

const router = Router();

router.get("/", ensureUser, async (req: Request, res: Response) => {
    try {
        const userId = req.session.userId;
        const { page = "1", limit = "20", status, title, file_name, sort_by = "created_at", sort_order = "desc" } = req.query as JobsQueryParams;

        // Validate pagination parameters
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const offset = (pageNum - 1) * limitNum;

        // Build WHERE clauses for filtering
        const whereConditions: string[] = ["j.user_id = ?"];
        const queryParams: any[] = [userId];

        // Status filter
        if (status && ["pending", "queued", "processing", "completed", "failed", "cancelled"].includes(status)) {
            whereConditions.push("j.status = ?");
            queryParams.push(status);
        }

        // Title filter
        if (title) {
            whereConditions.push("j.title LIKE ?");
            queryParams.push(`%${title}%`);
        }

        // File name filter
        if (file_name) {
            whereConditions.push("j.file_name LIKE ?");
            queryParams.push(`%${file_name}%`);
        }

        // Build ORDER BY clause
        const validSortColumns = ["created_at", "updated_at", "priority", "status"];
        const sortColumn = validSortColumns.includes(sort_by) ? sort_by : "created_at";
        const sortDirection = sort_order === "asc" ? "ASC" : "DESC";

        // Construct the main query
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";
        const orderClause = `ORDER BY ${sortColumn} ${sortDirection}`;
        const limitClause = `LIMIT ${limitNum} OFFSET ${offset}`;

        const mainQuery = `
            SELECT 
                j.*,
                v.title as video_title,
                v.file_name as video_file_name,
                v.resolution as video_resolution
            FROM jobs j
            LEFT JOIN videos v ON j.video_id = v.id
            ${whereClause}
            ${orderClause}
            ${limitClause}
        `;

        // Count query for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM jobs j
            ${whereClause}
        `;

        // Execute queries
        const [jobs, countResult] = await Promise.all([db.all(mainQuery, queryParams), db.get(countQuery, queryParams)]);

        const total = countResult?.total || 0;
        const totalPages = Math.ceil(total / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        // Transform jobs data to match frontend format
        const transformedJobs: FrontendJob[] = jobs.map((job: any) => {
            // Parse tags
            let tags: string[] = [];
            if (job.tags) {
                try {
                    tags = job.tags.startsWith("[") ? JSON.parse(job.tags) : job.tags.split(",").map((t: string) => t.trim());
                } catch {
                    tags = job.tags.split(",").map((t: string) => t.trim());
                }
            }

            // Parse conversion settings
            let conversionSettings = null;
            if (job.conversion_settings) {
                try {
                    conversionSettings = JSON.parse(job.conversion_settings);
                } catch {
                    conversionSettings = job.conversion_settings;
                }
            }
            console.log(job);
            // Build error object if job failed
            let error: JobError | undefined;
            if (job.status === "failed" && job.error_message) {
                error = {
                    message: job.error_message,
                    code: job.error_code || "UNKNOWN_ERROR",
                    retriable: !!job.error_retriable === true,
                };
            }

            return {
                id: job.id.toString(),
                title: job.title || job.video_title || "Untitled Job",
                status: job.status,
                statusDescription: job.status_description || getDefaultStatusDescription(job.status),
                healthStatus: job.health_status || getDefaultHealthStatus(job.status),
                age: calculateAge(job.created_at),
                createdAt: job.created_at,
                completedAt: job.completed_at || null,
                duration: job.duration || null,
                jobType: job.job_type || "unknown",
                tags,
                fileName: job.file_name || job.video_file_name || "unknown.mp4",
                formattedFileSize: FileUtils.formatFileSize(job.file_size || 0),
                resolution: job.resolution || job.video_resolution || "Unknown",
                previewUrl: job.preview_url || null,
                thumbnailUrl: job.thumbnail_url || null,
                progressSteps: generateProgressSteps(job),
                progressPercentage: job.progress_precentage || 0,
                currentStep: job.current_step || null,
                ...(error && { error }),
                actions: getJobActions(job),
            };
        });

        // Response with pagination metadata
        res.json({
            jobs: transformedJobs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
                hasNextPage,
                hasPrevPage,
            },
            filters: {
                status,
                title,
                file_name,
            },
            sorting: {
                sort_by: sortColumn,
                sort_order: sortDirection.toLowerCase(),
            },
        });
    } catch (error) {
        console.error("Error fetching jobs:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to fetch jobs",
        });
    }
});

// Additional helper endpoint for job statistics
router.get("/stats", ensureUser, async (req: Request, res: Response) => {
    try {
        const userId = req.session.userId!;
        const stats = await jobService.getUserJobStats(userId);

        res.json({
            data: stats,
        });
    } catch (error) {
        console.error("Error fetching job stats:", error);
        res.status(500).json({
            error: "Internal server error",
            message: "Failed to fetch job statistics",
        });
    }
});

router.get("/:jobId", async (req: Request, res: Response) => {
    try {
        const jobId = parseInt(req.params.jobId);

        if (!jobId) {
            res.status(400).json({ message: "jonId is required" });
            return;
        }

        // Get full job details from database
        const job = await jobService.getById(jobId);

        if (!job) {
            res.status(404).json({ error: "Job not found in database" });
            return;
        }

        res.json({
            success: true,
            job: {
                ...job,
                conversion_settings: JSON.parse(job.conversion_settings || "{}"),
            },
        });
        return;
    } catch (error) {
        console.error("Error getting next job:", error);
        res.status(500).json({ error: "Failed to get next job" });
    }
});

router.post("/start/:jobId", async (req, res) => {
    const jobId = parseInt(req.params.jobId);

    if (!jobId) {
        res.status(400).json({
            error: `jobId is required to start a job:`,
        });
        return;
    }

    const workerId = req.header("worker-id");
    if (!workerId) {
        res.status(401).json({
            error: "workerId not present.",
        });
        return;
    }

    try {
        await jobService.startJob(jobId, workerId);

        res.status(200).json({
            message: "job status updated",
        });
    } catch (error) {
        res.status(400).json({
            error: `Error starting job ${jobId}:`,
        });
        return;
    }
});
export default router;
