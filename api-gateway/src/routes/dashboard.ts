import { ensureUser } from "@/middlewares/session";
import { DashboardRepository } from "@/Repository/Dashbord";
import { FileUtils } from "@/utils/file";
import { Request, Response, Router } from "express";

const router = Router();
const dashboardRepo = new DashboardRepository();

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

// Helper function to process user job stats
const processUserStats = (userJobStats: any[], totalStorage: number) => {
    const userStats = {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        totalStorage,
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

    return userStats;
};

// Helper function to process queue stats
const processQueueStats = (queueStats: any[]) => {
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
    return queueStatsProcessed;
};

// Helper function to process health stats
const processHealthStats = (healthStats: any[]) => {
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

    return healthStatsProcessed;
};

// GET /api/dashboard - Get dashboard statistics and recent jobs
router.get("/", ensureUser, async (req: Request, res: Response) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            res.json({
                error: "user must have session",
            });
            return;
        }

        // Get all required data using repository
        const [userJobStats, totalStorage, queueStats, monitoringData, recentJobs] = await Promise.all([
            dashboardRepo.getUserJobStats(userId),
            dashboardRepo.getUserTotalStorage(userId),
            dashboardRepo.getQueueStats(),
            dashboardRepo.getMonitoringData(),
            dashboardRepo.getRecentJobs(userId, 10),
        ]);

        // Process the data
        const userStats = processUserStats(userJobStats, totalStorage);
        const queueStatsProcessed = processQueueStats(queueStats);
        const healthStatsProcessed = processHealthStats(monitoringData.healthStats);

        // Build dashboard stats
        const stats: DashboardStats = {
            user: userStats,
            queue: queueStatsProcessed,
            monitoring: {
                totalJobs: monitoringData.totalJobs,
                healthyJobs: healthStatsProcessed.healthy,
                unhealthyJobs: healthStatsProcessed.unhealthy,
                stuckJobs: monitoringData.stuckJobs,
                orphanedFiles: monitoringData.orphanedFiles,
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
        const queueStats = await dashboardRepo.getDetailedQueueStats();

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
        const [dbConnected, stuckJobs, queueDepth] = await Promise.all([
            dashboardRepo.testDatabaseConnection(),
            dashboardRepo.getStuckJobsCountWithTimeout(2), // 2 hours timeout
            dashboardRepo.getQueueDepth(),
        ]);

        const health = {
            database: dbConnected,
            stuckJobs,
            queueDepth,
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
