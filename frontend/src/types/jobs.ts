export interface ProgressStep {
    step: string;
    timestamp: string;
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

export interface Job {
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

export interface JobsResponse {
    success: boolean; // Fixed typo
    jobs: Job[];
    pagination: {
        page: number;
        limit: number;
        totalPages: number;
        totalItems: number;
    };
}

export interface ItemData {
    jobs: Job[];
    selectedJobs: Set<string>;
    onJobSelect: (jobId: string) => void;
    onJobClick: (job: Job) => void;
    onMouseEnter: (job: Job, event: React.MouseEvent) => void;
    onMouseMove: (event: React.MouseEvent) => void;
    onMouseLeave: () => void;
}
