import { Monitor, Smartphone, Tv } from "lucide-react";

// src/utils/constants.ts
export const APP_CONFIG = {
    APP_TITLE: import.meta.env.VITE_APP_TITLE || "Video Processing Pipeline",
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
    MAX_FILE_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 1024 * 1024 * 1024, // 1GB
    CHUNK_SIZE: parseInt(import.meta.env.VITE_CHUNK_SIZE) || 1024 * 1024, // 1MB
    MAX_CONCURRENT_UPLOADS: 3,
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    POLLING_INTERVAL: 5000, // 5 seconds
    RETRY_ATTEMPTS: 3,
} as const;

export const SUPPORTED_FORMATS = {
    INPUT: ["video/mp4", "video/avi", "video/mov", "video/wmv", "video/flv", "video/webm", "video/mkv", "video/m4v", "video/3gp", "video/quicktime"],
    OUTPUT: ["mp4", "avi", "mov", "wmv", "webm", "mkv", "flv", "mp3", "wav", "gif"],
} as const;

export const OUTPUT_FORMATS = [
    { value: "mp4", label: "MP4", description: "Most compatible format" },
    { value: "avi", label: "AVI", description: "High quality, larger files" },
    { value: "mov", label: "MOV", description: "Apple QuickTime format" },
] as const;

export const ACCEPTED_FORMATS = ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"] as const;
export type AcceptedFormat = (typeof ACCEPTED_FORMATS)[number];
export type AcceptedQuality = "1080p" | "720p" | "480p";

export const QUALITY_PRESETS = [
    {
        value: "1080p",
        label: "Full HD (1080p)",
        description: "1920×1080 • Best quality",
        icon: Monitor,
        fileSize: "Large files",
    },
    {
        value: "720p",
        label: "HD (720p)",
        description: "1280×720 • Good balance",
        icon: Tv,
        fileSize: "Medium files",
    },
    {
        value: "480p",
        label: "SD (480p)",
        description: "854×480 • Smaller files",
        icon: Smartphone,
        fileSize: "Small files",
    },
] as const;
export const RESOLUTION_PRESETS = [
    { label: "480p", value: "854x480" },
    { label: "720p", value: "1280x720" },
    { label: "1080p", value: "1920x1080" },
    { label: "1440p", value: "2560x1440" },
    { label: "4K", value: "3840x2160" },
] as const;

export const JOB_STATUS_COLORS = {
    pending: "bg-gray-100 text-gray-800",
    queued: "bg-blue-100 text-blue-800",
    processing: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
} as const;

export const JOB_STATUS_ICONS = {
    pending: "Clock",
    queued: "Timer",
    processing: "Play",
    completed: "CheckCircle",
    failed: "XCircle",
    cancelled: "X",
} as const;

export const ROUTES = {
    DASHBOARD: "/dashboard",
    UPLOAD: "/upload",
    JOBS: "/jobs",
    JOB_DETAIL: (jobId: string) => `/jobs/${jobId}`,
    MONITORING: "/monitoring",
} as const;

export const NOTIFICATION_TYPES = {
    SUCCESS: "success",
    ERROR: "error",
    WARNING: "warning",
    INFO: "info",
} as const;

// File size formatters
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Duration formatters
export const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// Date formatters
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
};

export const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
};
