import { db } from "@/database/connection";
import { CreateJobData, Job } from "@/types/job";

export class JobRepository {
    static async create(jobData: CreateJobData): Promise<Job> {
        try {
            const result = await db.run(
                `INSERT INTO jobs (
                    user_id, video_id, title, status, health_status, status_description,
                    job_type, conversion_settings, tags, created_at, duration, file_name, file_size,
                    resolution, output_file, preview_url, thumbnail_url,
                    retry_count, priority, worker_id, error_message, error_code,
                    error_retriable
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    jobData.user_id,
                    jobData.video_id,
                    jobData.title || null,
                    jobData.status,
                    jobData.health_status || null,
                    jobData.status_description || null,
                    jobData.job_type,
                    jobData.conversion_settings,
                    jobData.tags || null,
                    jobData.created_at,
                    jobData.duration || null,
                    jobData.file_name || null,
                    jobData.file_size || null,
                    jobData.resolution || null,
                    jobData.output_file || null,
                    jobData.preview_url || null,
                    jobData.thumbnail_url || null,
                    jobData.retry_count || 0,
                    jobData.priority || 0,
                    jobData.worker_id || null,
                    jobData.error_message || null,
                    jobData.error_code || null,
                    jobData.error_retriable || null,
                ]
            );

            const job = await db.get("SELECT * FROM jobs WHERE id = ?", [result.lastID]);
            return job as Job;
        } catch (error) {
            console.error("Error creating job:", error);
            throw error;
        }
    }

    static async findById(id: number): Promise<Job | null> {
        try {
            const job = await db.get("SELECT * FROM jobs WHERE id = ?", [id]);
            return (job as Job) || null;
        } catch (error) {
            console.error("Error finding job by ID:", error);
            throw error;
        }
    }

    static async findByUserId(userId: number): Promise<Job[]> {
        try {
            const jobs = await db.all("SELECT * FROM jobs WHERE user_id = ? ORDER BY created_at DESC", [userId]);
            return jobs as Job[];
        } catch (error) {
            console.error("Error finding jobs by user ID:", error);
            throw error;
        }
    }

    static async findByVideoId(videoId: number): Promise<Job[]> {
        try {
            const jobs = await db.all("SELECT * FROM jobs WHERE video_id = ? ORDER BY created_at DESC", [videoId]);
            return jobs as Job[];
        } catch (error) {
            console.error("Error finding jobs by video ID:", error);
            throw error;
        }
    }

    static async updateStatus(
        id: number,
        status: Job["status"],
        opts: {
            outputFile?: string;
            errorMessage?: string;
            errorCode?: string;
            errorRetriable?: boolean;
            healthStatus?: Job["health_status"];
            statusDescription?: string;
            workerId?: string;
            previewUrl?: string;
            thumbnailUrl?: string;

            currentStep?: string;
            progressPercentage?: number;
            stepDetails?: string;
        } = {}
    ): Promise<void> {
        const now = new Date().toISOString();
        const startedAt = status === "processing" ? now : undefined;
        const completed = status === "completed" || status === "failed" ? now : null;

        try {
            await db.run(
                `UPDATE jobs
           SET status             = ?,
               output_file        = COALESCE(?,  output_file),
               error_message      = ?,
               error_code         = ?,
               error_retriable    = ?,
               health_status      = COALESCE(?,  health_status),
               status_description = COALESCE(?,  status_description),
               worker_id          = COALESCE(?,  worker_id),
               preview_url        = COALESCE(?,  preview_url),
               thumbnail_url      = COALESCE(?,  thumbnail_url),
               current_step       = COALESCE(?,  current_step),
               progress_percentage= COALESCE(?,  progress_percentage),
               step_details       = COALESCE(?,  step_details),
               completed_at       = ?,
               started_at         = ?,
               updated_at         = ?
         WHERE id = ?`,
                [
                    status,
                    opts.outputFile ?? null,
                    opts.errorMessage ?? null,
                    opts.errorCode ?? null,
                    opts.errorRetriable ?? null,
                    opts.healthStatus ?? null,
                    opts.statusDescription ?? null,
                    opts.workerId ?? null,
                    opts.previewUrl ?? null,
                    opts.thumbnailUrl ?? null,
                    opts.currentStep ?? null,
                    opts.progressPercentage ?? null,
                    opts.stepDetails ?? null,
                    completed,
                    startedAt,
                    now,
                    id,
                ]
            );
        } catch (e) {
            console.error("Error updating job status:", e);
            throw e;
        }
    }

    static async findPendingJobs(limit?: number): Promise<Job[]> {
        try {
            const query = limit
                ? "SELECT * FROM jobs WHERE status = 'pending' ORDER BY priority DESC, created_at ASC LIMIT ?"
                : "SELECT * FROM jobs WHERE status = 'pending' ORDER BY priority DESC, created_at ASC";

            const params = limit ? ["pending", limit] : ["pending"];
            const jobs = await db.all(query, params);
            return jobs as Job[];
        } catch (error) {
            console.error("Error finding pending jobs:", error);
            throw error;
        }
    }

    static async findQueuedJobs(limit?: number): Promise<Job[]> {
        try {
            const query = limit
                ? "SELECT * FROM jobs WHERE status = 'queued' ORDER BY priority DESC, created_at ASC LIMIT ?"
                : "SELECT * FROM jobs WHERE status = 'queued' ORDER BY priority DESC, created_at ASC";

            const params = limit ? ["queued", limit] : ["queued"];
            const jobs = await db.all(query, params);
            return jobs as Job[];
        } catch (error) {
            console.error("Error finding queued jobs:", error);
            throw error;
        }
    }

    static async findJobsByStatus(status: Job["status"], limit?: number): Promise<Job[]> {
        try {
            const query = limit
                ? "SELECT * FROM jobs WHERE status = ? ORDER BY created_at DESC LIMIT ?"
                : "SELECT * FROM jobs WHERE status = ? ORDER BY created_at DESC";

            const params = limit ? [status, limit] : [status];
            const jobs = await db.all(query, params);
            return jobs as Job[];
        } catch (error) {
            console.error(`Error finding jobs by status ${status}:`, error);
            throw error;
        }
    }

    static async incrementRetryCount(id: number): Promise<void> {
        try {
            await db.run("UPDATE jobs SET retry_count = retry_count + 1, updated_at = ? WHERE id = ?", [new Date().toISOString(), id]);
        } catch (error) {
            console.error("Error incrementing retry count:", error);
            throw error;
        }
    }

    static async delete(id: number): Promise<void> {
        try {
            await db.run("DELETE FROM jobs WHERE id = ?", [id]);
        } catch (error) {
            console.error("Error deleting job:", error);
            throw error;
        }
    }

    static async getJobStats(userId: number): Promise<{
        total: number;
        pending: number;
        queued: number;
        processing: number;
        completed: number;
        failed: number;
        cancelled: number;
        totalStorage: number;
        avgProcessingTime: number;
    }> {
        try {
            const stats = await db.get(
                `SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued,
                    SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                    SUM(file_size) as totalStorage,
                    AVG(
                        CASE 
                            WHEN started_at IS NOT NULL AND completed_at IS NOT NULL 
                            THEN (julianday(completed_at) - julianday(started_at)) * 86400
                            ELSE NULL 
                        END
                    ) as avgProcessingTime
                FROM jobs 
                WHERE user_id = ?`,
                [userId]
            );

            return {
                total: stats.total || 0,
                pending: stats.pending || 0,
                queued: stats.queued || 0,
                processing: stats.processing || 0,
                completed: stats.completed || 0,
                failed: stats.failed || 0,
                cancelled: stats.cancelled || 0,
                totalStorage: stats.totalStorage || 0,
                avgProcessingTime: stats.avgProcessingTime || 0,
            };
        } catch (error) {
            console.error("Error getting job stats:", error);
            throw error;
        }
    }

    static async findJobsByWorker(workerId: string): Promise<Job[]> {
        try {
            const jobs = await db.all("SELECT * FROM jobs WHERE worker_id = ? ORDER BY started_at DESC", [workerId]);
            return jobs as Job[];
        } catch (error) {
            console.error("Error finding jobs by worker:", error);
            throw error;
        }
    }

    static async findJobsWithRetries(maxRetries: number = 3): Promise<Job[]> {
        try {
            const jobs = await db.all(
                `SELECT * FROM jobs 
                 WHERE status = 'failed' 
                 AND retry_count < ? 
                 AND error_retriable = 1 
                 ORDER BY created_at ASC`,
                [maxRetries]
            );
            return jobs as Job[];
        } catch (error) {
            console.error("Error finding jobs with retries:", error);
            throw error;
        }
    }

    static async updateJobProgress(id: number, status: Job["status"], statusDescription: string): Promise<void> {
        try {
            await db.run("UPDATE jobs SET status = ?, status_description = ?, updated_at = ? WHERE id = ?", [
                status,
                statusDescription,
                new Date().toISOString(),
                id,
            ]);
        } catch (error) {
            console.error("Error updating job progress:", error);
            throw error;
        }
    }

    static async updateJobStep(id: number, step: string, percent: number, statusDescription?: string, stepDetails?: string): Promise<void> {
        try {
            await db.run(
                `UPDATE jobs SET 
                    current_step        = ?,
                    progress_percentage = ?,
                    status_description  = COALESCE(?, status_description),
                    step_details        = COALESCE(?, step_details),
                    updated_at          = ?
                WHERE id = ?`,
                [step, percent, statusDescription ?? null, stepDetails ?? null, new Date().toISOString(), id]
            );
        } catch (e) {
            console.error("Error updating job step:", e);
            throw e;
        }
    }
}
