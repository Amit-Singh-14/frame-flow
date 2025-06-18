export interface User {
    id: number;
    session_id: string;
    created_at: string;
}

export interface Job {
    id: number;
    user_id: number;
    status: JobStatus;
    input_file: string;
    output_file?: string;
    error_message?: string;
    created_at: string;
    completed_at?: string;
    conversion_settings?: string;
    file_size: number;
}

export enum JobStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed",
}

export interface ConversionRequest {
    input_file: string;
    output_format: string;
    quality: string;
}

export interface ConversionResponse {
    job_id: number;
    status: string;
    output_file?: string;
    error?: string;
}

export interface SessionData {
    userId?: number;
    sessionId?: string;
}

declare module "express-session" {
    interface SessionData {
        userId?: number;
        sessionId?: string;
    }
}
