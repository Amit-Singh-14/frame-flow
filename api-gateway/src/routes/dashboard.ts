import { db } from "@/database/connection";
import { ensureUser } from "@/middlewares/session";
import { FileUtils } from "@/utils/file";
import { Request, Response, Router } from "express";
const router = Router();

export interface DashboardStats {
    user: {
        total: number;
        pending: number;
        processing: number;
        completed: number;
        failed: number;
        totalStorage: number;
    };
    queue: {
        queued: number;
        processing: number;
        totalInProgress: number;
    };
    monitoring: {
        totalJobs: number;
        healthyJobs: number;
        unhealthyJobs: number;
        stuckJobs: number;
        orphanedFiles: number;
        lastMonitorRun: string;
    };
    service: {
        initialized: boolean;
        version: string;
    };
}

export interface RecentJob {
    id: string;
    input_file: string;
    status: string;
    created_at: string;
    age: string;
    statusDescription: string;
    healthStatus: string;
    formattedFileSize: string;
    file_size: number;
}

interface DashboardData {
    success: boolean;
    stats: DashboardStats;
    recentJobs: RecentJob[];
}

// Helper function to calculate age from timestamp
const calculateAge = (timestamp: string): string => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffMs = now.getTime() - created.getTime();

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
};

// GET /api/dashboard - Get dashboard statistics and recent jobs
router.get("/", ensureUser, async (req: Request, res: Response) => {
    try {
        const userId = req.session.userId;

        // Get user job statistics
        const userJobStats = await db.all(
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

        // Get total storage for user (from videos table)
        const userStorageResult = await db.get(
            `
            SELECT COALESCE(SUM(file_size), 0) as total_storage
            FROM videos 
            WHERE user_id = ? AND is_active = 1
        `,
            [userId]
        );

        // Get queue statistics (across all users)
        const queueStats = await db.all(`
            SELECT 
                status,
                COUNT(*) as count
            FROM jobs 
            WHERE status IN ('queued', 'processing')
            GROUP BY status
        `);

        // Get monitoring statistics
        const [totalJobsResult, healthStats, stuckJobsResult] = await Promise.all([
            db.get("SELECT COUNT(*) as total FROM jobs"),
            db.all(`
                SELECT 
                    health_status,
                    COUNT(*) as count
                FROM jobs 
                WHERE health_status IS NOT NULL
                GROUP BY health_status
            `),
            db.get(`
                SELECT COUNT(*) as stuck_count
                FROM jobs 
                WHERE status = 'processing' 
                AND started_at IS NOT NULL 
                AND datetime('now', '-1 hour') > started_at
            `),
        ]);

        // Get orphaned files count (videos without active jobs)
        const orphanedFilesResult = await db.get(`
            SELECT COUNT(*) as orphaned_count
            FROM videos v
            WHERE v.is_active = 1 
            AND NOT EXISTS (
                SELECT 1 FROM jobs j 
                WHERE j.video_id = v.id 
                AND j.status IN ('pending', 'queued', 'processing')
            )
        `);

        // Get recent jobs for the user
        const recentJobs = await db.all(
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
            LIMIT 10
        `,
            [userId]
        );

        // Process user stats
        const userStats = {
            total: 0,
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0,
            totalStorage: userStorageResult?.total_storage || 0,
        };

        userJobStats.forEach((stat: any) => {
            userStats.total += stat.count;
            switch (stat.status) {
                case "pending":
                    userStats.pending = stat.count;
                    break;
                case "processing":
                    userStats.processing = stat.count;
                    break;
                case "completed":
                    userStats.completed = stat.count;
                    break;
                case "failed":
                    userStats.failed = stat.count;
                    break;
            }
        });

        // Process queue stats
        const queueStatsProcessed = {
            queued: 0,
            processing: 0,
            totalInProgress: 0,
        };

        queueStats.forEach((stat: any) => {
            if (stat.status === "queued") {
                queueStatsProcessed.queued = stat.count;
            } else if (stat.status === "processing") {
                queueStatsProcessed.processing = stat.count;
            }
        });
        queueStatsProcessed.totalInProgress = queueStatsProcessed.queued + queueStatsProcessed.processing;

        // Process health stats
        const healthStatsProcessed = {
            healthy: 0,
            unhealthy: 0,
        };

        healthStats.forEach((stat: any) => {
            if (stat.health_status === "healthy") {
                healthStatsProcessed.healthy = stat.count;
            } else if (stat.health_status === "unhealthy") {
                healthStatsProcessed.unhealthy = stat.count;
            }
        });

        // Build dashboard stats
        const stats: DashboardStats = {
            user: userStats,
            queue: queueStatsProcessed,
            monitoring: {
                totalJobs: totalJobsResult?.total || 0,
                healthyJobs: healthStatsProcessed.healthy,
                unhealthyJobs: healthStatsProcessed.unhealthy,
                stuckJobs: stuckJobsResult?.stuck_count || 0,
                orphanedFiles: orphanedFilesResult?.orphaned_count || 0,
                lastMonitorRun: new Date().toISOString(),
            },
            service: {
                initialized: true,
                version: process.env.APP_VERSION || "1.0.0",
            },
        };

        // Process recent jobs
        const recentJobsProcessed: RecentJob[] = recentJobs.map((job: any) => ({
            id: job.id.toString(),
            input_file: job.input_file || "Unknown",
            status: job.status,
            created_at: job.created_at,
            age: calculateAge(job.created_at),
            statusDescription: job.status_description || "",
            healthStatus: job.health_status || "unknown",
            formattedFileSize: FileUtils.formatFileSize(job.file_size || 0),
            file_size: job.file_size || 0,
        }));

        const dashboardData: DashboardData = {
            success: true,
            stats,
            recentJobs: recentJobsProcessed,
        };

        res.json(dashboardData);
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to fetch dashboard data",
        });
    }
});

// Additional endpoint for real-time queue monitoring
router.get("/queue", ensureUser, async (req: Request, res: Response) => {
    try {
        const queueStats = await db.all(`
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

        res.json({
            success: true,
            queue: queueStats,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error fetching queue stats:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            message: "Failed to fetch queue statistics",
        });
    }
});

// Endpoint for system health check
router.get("/health", ensureUser, async (req: Request, res: Response) => {
    try {
        const healthChecks = await Promise.all([
            // Database connectivity
            db.get("SELECT 1 as db_check"),
            // Check for stuck jobs
            db.get(`
                SELECT COUNT(*) as stuck_jobs
                FROM jobs 
                WHERE status = 'processing' 
                AND started_at IS NOT NULL 
                AND datetime('now', '-2 hours') > started_at
            `),
            // Check queue depth
            db.get(`
                SELECT COUNT(*) as queue_depth
                FROM jobs 
                WHERE status = 'queued'
            `),
        ]);

        const [dbResult, stuckJobsResult, queueDepthResult] = healthChecks;

        const health = {
            database: !!dbResult?.db_check,
            stuckJobs: stuckJobsResult?.stuck_jobs || 0,
            queueDepth: queueDepthResult?.queue_depth || 0,
            status: "healthy",
            timestamp: new Date().toISOString(),
        };

        // Determine overall health status
        if (health.stuckJobs > 5) {
            health.status = "warning";
        }
        if (health.stuckJobs > 10 || health.queueDepth > 100) {
            health.status = "unhealthy";
        }
        if (!health.database) {
            health.status = "critical";
        }

        res.json({
            success: true,
            health,
        });
    } catch (error) {
        console.error("Error checking system health:", error);
        res.status(500).json({
            success: false,
            health: {
                database: false,
                status: "critical",
                error: (error as any).message,
                timestamp: new Date().toISOString(),
            },
        });
    }
});

export default router;
