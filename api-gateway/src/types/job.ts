export const BASIC_JOB_TYPES = ["transcode", "compress", "resize", "change-framerate", "convert-container"] as const;

export type JobType = (typeof BASIC_JOB_TYPES)[number];

export enum JobStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed",
}

export interface Job {
    id: number;
    user_id: number;
    video_id: number;
    title?: string;
    status: "pending" | "queued" | "processing" | "completed" | "failed" | "cancelled";
    health_status?: "healthy" | "unhealthy" | "in-progress" | "waiting";
    status_description?: string;
    job_type: "transcode" | "compress" | "resize" | "change-framerate" | "convert-container";
    conversion_settings: string;
    tags?: string;
    created_at: string;
    started_at?: string;
    completed_at?: string;
    updated_at?: string;
    duration?: number;
    file_name?: string;
    file_size?: number;
    resolution?: string;
    output_file?: string;
    preview_url?: string;
    thumbnail_url?: string;
    retry_count: number;
    priority: number;
    worker_id?: string;
    error_message?: string;
    error_code?: string;
    error_retriable?: boolean;
}

export interface CreateJobData {
    user_id: number;
    video_id: number;
    title?: string;
    status: Job["status"];
    health_status?: Job["health_status"];
    status_description?: string;
    job_type: Job["job_type"];
    conversion_settings: string;
    tags?: string;
    created_at: string;
    duration?: number;
    file_name?: string;
    file_size?: number;
    resolution?: string;
    output_file?: string;
    preview_url?: string;
    thumbnail_url?: string;
    retry_count?: number;
    priority?: number;
    worker_id?: string;
    error_message?: string;
    error_code?: string;
    error_retriable?: boolean;
}

export interface ProgressStep {
    step: string;
    timestamp: string;
    status_description?: string;
}

export interface JobError {
    message: string;
    code: string;
    retriable: boolean;
}

export interface JobActions {
    canRetry: boolean;
    canDelete: boolean;
}

export interface FrontendJob {
    id: string;
    title: string;
    status: string;
    statusDescription: string;
    healthStatus: string;
    age: string;
    createdAt: string;
    completedAt: string | null;
    duration: number | null;
    jobType: string;
    tags: string[];
    fileName: string;
    formattedFileSize: string;
    resolution: string;
    previewUrl: string | null;
    thumbnailUrl: string | null;
    progressSteps: ProgressStep[];
    error?: JobError;
    actions: JobActions;
}
