import { JobActions, ProgressStep } from "@/types/job";

// Helper function to generate progress steps
export const generateProgressSteps = (job: any): ProgressStep[] => {
    const steps: ProgressStep[] = [];

    // Always add cerated/queued step
    if (job.created_at) {
        steps.push({ step: "queued", timestamp: job.created_at, status_description: "Job added to queue" });
    }

    // Add processing step if started
    if (job.started_at) {
        steps.push({
            step: "processing",
            timestamp: job.started_at,
            status_description: job.current_step ? `Currenlty:${job.current_step}` : "Job processing started",
        });
    }

    // Add current step if job is in progress and we have step info
    if (job.status === "processing" && job.current_step && job.updated_at) {
        // only add if it's different from the basic "processing" step
        if (job.current_step != "processing") {
            steps.push({
                step: job.current_step,
                timestamp: job.updated_at,
                status_description: getStepDescription(job.current_step),
            });
        }
    }

    // Add completion step
    if (job.completed_at) {
        const finalStatus = job.status === "failed" ? "failed" : "completed";
        steps.push({
            step: finalStatus,
            timestamp: job.completed_at,
            status_description: job.status === "failed" ? job.error_message || "Job failed" : "Job completed successfully",
        });
    }

    return steps;
};

// Helper function to get user-friendly step descriptions
export const getStepDescription = (step: string): string => {
    const stepDescriptions: { [key: string]: string } = {
        waiting_for_queue: "Waiting for queue service",
        in_queue: "Waiting in processing queue",
        transcoding_started: "Starting transcoding process",
        encoding_video: "Encoding video content",
        generating_thumbnail: "Creating thumbnail",
        finalizing_job: "Finalizing output",
        uploading_output: "Uploading processed file",
        queue_service_unavailable: "Queue service temporarily unavailable",
    };

    return stepDescriptions[step] || step.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

// Helper function to determine job actions
export const getJobActions = (job: any): JobActions => {
    const canRetry = job.status === "failed" && !!job.error_retriable === true;
    const canDelete = ["completed", "failed", "queued"].includes(job.status);

    return { canRetry, canDelete };
};

// Helper function for default status descriptions
export function getDefaultStatusDescription(status: string, currentStep?: string): string {
    if (status === "processing" && currentStep) {
        return getStepDescription(currentStep);
    }

    const descriptions = {
        pending: "Job is pending",
        queued: "Waiting in queue",
        processing: currentStep ? getStepDescription(currentStep) : "Job is being processed",
        completed: "Job completed successfully",
        failed: "Job failed to complete",
        cancelled: "Job was cancelled",
    };
    return descriptions[status as keyof typeof descriptions] || "Unknown status";
}

// Helper function for default health status
export function getDefaultHealthStatus(status: string): string {
    const healthMap = {
        pending: "waiting",
        queued: "waiting",
        processing: "in-progress",
        completed: "healthy",
        failed: "unhealthy",
        cancelled: "unhealthy",
    };
    return healthMap[status as keyof typeof healthMap] || "unknown";
}

export const calculateAge = (timestamp: string): string => {
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
export const processUserStats = (userJobStats: any[], totalStorage: number) => {
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
export const processQueueStats = (queueStats: any[]) => {
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
export const processHealthStats = (healthStats: any[]) => {
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
