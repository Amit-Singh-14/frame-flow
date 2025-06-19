export interface UploadConfig {
    maxFileSize: number;
    allowedFormat: string[];
    uploadDir: string;
}

export interface UploadFile {
    originalName: string;
    filename: string;
    path: string;
    size: number;
    mimetype: string;
    formattedSize: string;
}

export interface JobInfo {
    id: number;
    status: string;
    input_file: string;
    created_at: string;
    file_size: number;
    conversion_settings: any;
    statusDescription: string;
    estimatedCompletion: string | Date | null;
    progress: number;
    healthStatus: "healthy" | "warning" | "critical";
    canRetry: { canRetry: boolean; reason?: string };
    canCancel: { canCancel: boolean; reason?: string };
    priority: "low" | "normal" | "high";
    progressMessage: string;
}

export interface UploadResponse {
    success: boolean;
    file?: UploadFile;
    job?: JobInfo;
    queue?: {
        queued: number;
        processing: number;
        totalInProgress: number;
    };

    metadata?: {
        uploadedAt: string;
        userId: number;
        jobCreated: boolean;
        queuedForProcessing: boolean;
    };
    error?: string;
    code?: string;
    details?: {
        message?: string;
        cleanupErrors?: string[];
    };
}
