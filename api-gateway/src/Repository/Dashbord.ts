import { db } from "@/database/connection";

export interface UserJobStats {
    status: string;
    count: number;
    total_size: number;
}

export interface QueueStats {
    status: string;
    count: number;
}

export interface HealthStats {
    health_status: string;
    count: number;
}

export interface RecentJobRaw {
    id: string;
    status: string;
    created_at: string;
    status_description: string;
    health_status: string;
    file_size: number;
    input_file: string;
}

export interface QueueStatsDetailed {
    status: string;
    priority: number;
    count: number;
    avg_processing_time: number;
}

export class DashboardRepository {
    /**
     * Get user job statistics grouped by status
     */
    async getUserJobStats(userId: number): Promise<UserJobStats[]> {
        return await db.all(
            `
            SELECT 
                status,
                COUNT(*) as count,
                COALESCE(SUM(file_size), 0) as total_size
            FROM jobs 
            WHERE user_id = ? 
            GROUP BY status
        `,
            [userId]
        );
    }

    /**
     * Get total storage used by user from videos table
     */
    async getUserTotalStorage(userId: number): Promise<number> {
        const result = await db.get(
            `
            SELECT COALESCE(SUM(file_size), 0) as total_storage
            FROM videos 
            WHERE user_id = ? AND is_active = 1
        `,
            [userId]
        );
        return result?.total_storage || 0;
    }

    /**
     * Get queue statistics across all users
     */
    async getQueueStats(): Promise<QueueStats[]> {
        return await db.all(`
            SELECT 
                status,
                COUNT(*) as count
            FROM jobs 
            WHERE status IN ('queued', 'processing')
            GROUP BY status
        `);
    }

    /**
     * Get total jobs count
     */
    async getTotalJobsCount(): Promise<number> {
        const result = await db.get("SELECT COUNT(*) as total FROM jobs");
        return result?.total || 0;
    }

    /**
     * Get health statistics for all jobs
     */
    async getHealthStats(): Promise<HealthStats[]> {
        return await db.all(`
            SELECT 
                health_status,
                COUNT(*) as count
            FROM jobs 
            WHERE health_status IS NOT NULL
            GROUP BY health_status
        `);
    }

    /**
     * Get count of stuck jobs (processing for more than 1 hour)
     */
    async getStuckJobsCount(): Promise<number> {
        const result = await db.get(`
            SELECT COUNT(*) as stuck_count
            FROM jobs 
            WHERE status = 'processing' 
            AND started_at IS NOT NULL 
            AND datetime('now', '-1 hour') > started_at
        `);
        return result?.stuck_count || 0;
    }

    /**
     * Get count of orphaned files (videos without active jobs)
     */
    async getOrphanedFilesCount(): Promise<number> {
        const result = await db.get(`
            SELECT COUNT(*) as orphaned_count
            FROM videos v
            WHERE v.is_active = 1 
            AND NOT EXISTS (
                SELECT 1 FROM jobs j 
                WHERE j.video_id = v.id 
                AND j.status IN ('pending', 'queued', 'processing')
            )
        `);
        return result?.orphaned_count || 0;
    }

    /**
     * Get recent jobs for a specific user
     */
    async getRecentJobs(userId: number, limit: number = 10): Promise<RecentJobRaw[]> {
        return await db.all(
            `
            SELECT 
                j.id,
                j.status,
                j.created_at,
                j.status_description,
                j.health_status,
                j.file_size,
                v.input_file
            FROM jobs j
            LEFT JOIN videos v ON j.video_id = v.id
            WHERE j.user_id = ?
            ORDER BY j.created_at DESC
            LIMIT ?
        `,
            [userId, limit]
        );
    }

    /**
     * Get detailed queue statistics with priority and processing time
     */
    async getDetailedQueueStats(): Promise<QueueStatsDetailed[]> {
        return await db.all(`
            SELECT 
                status,
                priority,
                COUNT(*) as count,
                AVG(CASE 
                    WHEN started_at IS NOT NULL 
                    THEN (julianday('now') - julianday(started_at)) * 24 * 60 
                    ELSE 0 
                END) as avg_processing_time
            FROM jobs 
            WHERE status IN ('queued', 'processing')
            GROUP BY status, priority
            ORDER BY priority DESC, status
        `);
    }

    /**
     * Get count of stuck jobs with custom timeout
     */
    async getStuckJobsCountWithTimeout(timeoutHours: number): Promise<number> {
        const result = await db.get(`
            SELECT COUNT(*) as stuck_jobs
            FROM jobs 
            WHERE status = 'processing' 
            AND started_at IS NOT NULL 
            AND datetime('now', '-${timeoutHours} hours') > started_at
        `);
        return result?.stuck_jobs || 0;
    }

    /**
     * Get current queue depth
     */
    async getQueueDepth(): Promise<number> {
        const result = await db.get(`
            SELECT COUNT(*) as queue_depth
            FROM jobs 
            WHERE status = 'queued'
        `);
        return result?.queue_depth || 0;
    }

    /**
     * Test database connectivity
     */
    async testDatabaseConnection(): Promise<boolean> {
        try {
            const result = await db.get("SELECT 1 as db_check");
            return !!result?.db_check;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get all monitoring data in one call for efficiency
     */
    async getMonitoringData(): Promise<{
        totalJobs: number;
        healthStats: HealthStats[];
        stuckJobs: number;
        orphanedFiles: number;
    }> {
        const [totalJobs, healthStats, stuckJobs, orphanedFiles] = await Promise.all([
            this.getTotalJobsCount(),
            this.getHealthStats(),
            this.getStuckJobsCount(),
            this.getOrphanedFilesCount(),
        ]);

        return {
            totalJobs,
            healthStats,
            stuckJobs,
            orphanedFiles,
        };
    }
}
