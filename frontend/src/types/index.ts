// src/types/index.ts

// Job related types
export interface Job {
    id: string;
    sessionId: string;
    filename: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    status: JobStatus;
    progress: number;
    createdAt: string;
    updatedAt: string;
    startedAt?: string;
    completedAt?: string;
    failedAt?: string;
    conversionSettings: ConversionSettings;
    outputFiles?: OutputFile[];
    error?: string;
    retryCount: number;
    maxRetries: number;
}

export type JobStatus = "pending" | "queued" | "processing" | "completed" | "failed" | "cancelled";

export interface ConversionSettings {
    outputFormat: string;
    quality?: "low" | "medium" | "high";
    resolution?: string;
    bitrate?: number;
    fps?: number;
    codec?: string;
    customOptions?: Record<string, any>;
}

export interface OutputFile {
    id: string;
    filename: string;
    size: number;
    url: string;
    mimeType: string;
    createdAt: string;
}

// Job filters and pagination
export interface JobFilters {
    status?: JobStatus[];
    dateRange?: {
        start: Date;
        end: Date;
    };
    filename?: string;
    outputFormat?: string;
}

export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Upload related types
export interface UploadResponse {
    success: boolean;
    error?: string;
    code?: string;
    details?: any;
    file?: {
        originalName: string;
        filename: string;
        path: string;
        size: number;
        mimetype: string;
        formattedSize: string;
    };
    job?: {
        id: string;
        status: JobStatus;
        input_file: string;
        created_at: string;
        file_size: number;
        conversion_settings?: string;
        // Enhanced job information
        statusDescription: string;
        estimatedCompletion?: string;
        progress: number;
        healthStatus: string;
        canRetry: boolean;
        canCancel: boolean;
        priority: string;
        progressMessage: string;
    };
    queue?: QueueStats;
    metadata?: {
        uploadedAt: string;
        userId: string;
        jobCreated: boolean;
        queuedForProcessing: boolean;
    };
}

export interface QueueStats {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    queued: number;
    totalWorkers?: number;
    activeWorkers?: number;
    avgProcessingTime?: number;
}

export interface UploadProgress {
    filename: string;
    progress: number;
    status: "uploading" | "processing" | "completed" | "error";
    error?: string;
    uploadSpeed?: number;
    estimatedTimeRemaining?: number;
}

export interface FileUploadConfig {
    maxFileSize: number; // in bytes
    allowedFormats: string[];
    chunkSize: number;
    maxConcurrentUploads: number;
}

// User and Session types
export interface User {
    id: string;
    sessionId: string;
    createdAt: string;
    stats?: UserStats;
}

export interface UserStats {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalDataProcessed: number; // in bytes
}

// Monitoring types
export interface HealthStatus {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    services: ServiceHealth[];
}

export interface ServiceHealth {
    name: string;
    status: "healthy" | "degraded" | "unhealthy";
    responseTime?: number;
    error?: string;
    details?: Record<string, any>;
}

export interface QueueStatus {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    totalWorkers: number;
    activeWorkers: number;
    avgProcessingTime: number;
}

// Statistics types
export interface JobStatistics {
    total: number;
    byStatus: Record<JobStatus, number>;
    byFormat: Record<string, number>;
    completionRate: number;
    avgProcessingTime: number;
    totalFilesProcessed: number;
    totalDataProcessed: number; // in bytes
}

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface ApiError {
    message: string;
    code?: string;
    details?: Record<string, any>;
    status?: number;
}

// Form types
export interface ConversionFormData {
    outputFormat: string;
    quality: "low" | "medium" | "high";
    resolution?: string;
    customOptions?: Record<string, any>;
}

// Navigation types
export interface NavItem {
    label: string;
    path: string;
    icon?: string;
    badge?: number;
}

// Table types
export interface TableColumn<T = any> {
    key: keyof T | string;
    label: string;
    render?: (value: any, item: T) => React.ReactNode;
    sortable?: boolean;
    width?: string;
}

export interface TableProps<T> {
    data: T[];
    columns: TableColumn<T>[];
    loading?: boolean;
    pagination?: {
        current: number;
        total: number;
        pageSize: number;
        onChange: (page: number) => void;
    };
    onSort?: (key: string, order: "asc" | "desc") => void;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Component prop types
export interface BaseComponentProps {
    className?: string;
    children?: React.ReactNode;
}

export interface LoadingProps extends BaseComponentProps {
    size?: "sm" | "md" | "lg";
    text?: string;
}

export interface ModalProps extends BaseComponentProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: "sm" | "md" | "lg" | "xl";
}
