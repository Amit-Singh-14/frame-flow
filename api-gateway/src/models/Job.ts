import { db } from "@/database/connection";
import { Job, JobStatus } from "@/types";

export class JobModel {
    static async create(jobData: { user_id: number; input_file: string; conversion_settings?: string; file_size?: number }): Promise<Job> {
        try {
            const result = await db.run(
                `INSERT INTO jobs (user_id, input_file, conversion_settings, file_size) 
                    VALUES (?, ?, ?, ?)`,
                [jobData.user_id, jobData.input_file, jobData.conversion_settings || null, jobData.file_size || null]
            );

            const job = await db.get("SELECT * FROM jobs WHERE id = ?", [result.lastID]);

            return job;
        } catch (error) {
            console.error("Error creating job:", error);
            throw error;
        }
    }

    static async findById(id: number): Promise<Job | null> {
        try {
            const job = await db.get("SELECT * FROM jobs WHERE id = ?", [id]);

            return job || null;
        } catch (error) {
            console.error("Error finding job by ID:", error);
            throw error;
        }
    }

    static async findByUserId(userId: number): Promise<Job[]> {
        try {
            const jobs = await db.all("SELECT * FROM jobs WHERE user_id = ? ORDER BY        created_at DESC", [userId]);

            return jobs;
        } catch (error) {
            console.error("Error finding jobs by user ID:", error);
            throw error;
        }
    }

    static async updateStatus(id: number, status: JobStatus, outputFile?: string, errorMessage?: string): Promise<void> {
        try {
            const completedAt = status === JobStatus.COMPLETED ? new Date().toISOString() : null;

            await db.run(
                `
                UPDATE jobs
                    SET status = ?, output_file = ? , error_message = ?, completd_at = ?
                    WHERE id = ?
                `,
                [status, outputFile || null, errorMessage || null, completedAt, id]
            );
        } catch (error) {
            console.error("Error updating job status:", error);
            throw error;
        }
    }

    static async findPendingJobs(): Promise<Job[]> {
        try {
            const jobs = await db.all("SELECT * FROM jobs WHERE status = ? ORDER BY created_at ASC", [JobStatus.PENDING]);
            return jobs;
        } catch (error) {
            console.error("Error finding pending jobs:", error);
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
        processing: number;
        completed: number;
        failed: number;
    }> {
        try {
            const stats = await db.get(
                `
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
                    FROM jobs 
                    WHERE user_id = ?
                `,
                [userId]
            );

            return {
                total: stats.total || 0,
                pending: stats.pending || 0,
                processing: stats.processing || 0,
                completed: stats.completed || 0,
                failed: stats.failed || 0,
            };
        } catch (error) {
            console.error("Error getting job stats:", error);
            throw error;
        }
    }
}
