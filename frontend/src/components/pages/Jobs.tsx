import { useState, useMemo } from "react";
import {
    Search,
    Filter,
    RefreshCw,
    Play,
    Trash2,
    RotateCcw,
    AlertCircle,
    CheckCircle,
    Clock,
    Download,
    Eye,
    X,
    Calendar,
    FileText,
    Zap,
    MoreHorizontal,
} from "lucide-react";

// Mock API data
const mockApiResponse = {
    success: true,
    jobs: [
        {
            id: "job_001",
            title: "Interview_Clip_01",
            status: "completed",
            statusDescription: "Job completed successfully",
            healthStatus: "healthy",
            age: "2h 14m",
            createdAt: "2025-06-23T04:30:00Z",
            completedAt: "2025-06-23T05:15:00Z",
            duration: 2700,
            jobType: "transcode",
            tags: ["HD", "user-upload"],
            fileName: "interview_clip_01.mp4",
            formattedFileSize: "248 MB",
            resolution: "1920x1080",
            previewUrl: "https://cdn.example.com/previews/job_001.mp4",
            thumbnailUrl: "https://cdn.example.com/thumbnails/job_001.jpg",
            progressSteps: [
                { step: "queued", timestamp: "2025-06-23T04:30:00Z" },
                { step: "processing", timestamp: "2025-06-23T04:35:00Z" },
                { step: "completed", timestamp: "2025-06-23T05:15:00Z" },
            ],
            actions: {
                canRetry: false,
                canDelete: true,
            },
        },
        {
            id: "job_002",
            title: "Product_Demo_Short",
            status: "failed",
            statusDescription: "Job failed during transcoding",
            healthStatus: "unhealthy",
            age: "5h 2m",
            createdAt: "2025-06-23T01:00:00Z",
            completedAt: "2025-06-23T01:30:00Z",
            duration: 1800,
            jobType: "thumbnail-generation",
            tags: ["error", "retryable"],
            fileName: "product_demo_short.mp4",
            formattedFileSize: "112 MB",
            resolution: "1280x720",
            previewUrl: null,
            thumbnailUrl: null,
            progressSteps: [
                { step: "queued", timestamp: "2025-06-23T01:00:00Z" },
                { step: "processing", timestamp: "2025-06-23T01:05:00Z" },
                { step: "failed", timestamp: "2025-06-23T01:30:00Z" },
            ],
            error: {
                message: "FFmpeg process exited with code 1",
                code: "TRANSCODE_FAILURE",
                retriable: true,
            },
            actions: {
                canRetry: true,
                canDelete: true,
            },
        },
        {
            id: "job_003",
            title: "Promo_Reel_June",
            status: "processing",
            statusDescription: "Video is being processed",
            healthStatus: "in-progress",
            age: "35m",
            createdAt: "2025-06-23T07:25:00Z",
            completedAt: null,
            duration: null,
            jobType: "ai-tagging",
            tags: ["auto", "inference"],
            fileName: "promo_reel_june.mp4",
            formattedFileSize: "352 MB",
            resolution: "3840x2160",
            previewUrl: null,
            thumbnailUrl: "https://cdn.example.com/thumbnails/job_003.jpg",
            progressSteps: [
                { step: "queued", timestamp: "2025-06-23T07:25:00Z" },
                { step: "processing", timestamp: "2025-06-23T07:30:00Z" },
            ],
            actions: {
                canRetry: false,
                canDelete: false,
            },
        },
        {
            id: "job_004",
            title: "Marketing_Video_Final",
            status: "queued",
            statusDescription: "Waiting in queue",
            healthStatus: "waiting",
            age: "12m",
            createdAt: "2025-06-23T08:00:00Z",
            completedAt: null,
            duration: null,
            jobType: "transcode",
            tags: ["urgent", "marketing"],
            fileName: "marketing_video_final.mp4",
            formattedFileSize: "1.2 GB",
            resolution: "4096x2160",
            previewUrl: null,
            thumbnailUrl: "https://cdn.example.com/thumbnails/job_004.jpg",
            progressSteps: [{ step: "queued", timestamp: "2025-06-23T08:00:00Z" }],
            actions: {
                canRetry: false,
                canDelete: true,
            },
        },
    ],
    pagination: {
        page: 1,
        limit: 10,
        totalPages: 3,
        totalItems: 26,
    },
};

// Status badge component

type StatusType = "completed" | "failed" | "processing" | "queued" | string;
// type HealthStatusType = "healthy" | "unhealthy" | "in-progress" | "waiting" | string;

const StatusBadge = ({ status }: { status: StatusType }) => {
    const getStatusConfig = () => {
        switch (status) {
            case "completed":
                return {
                    bg: "bg-emerald-500/10",
                    text: "text-emerald-400",
                    border: "border-emerald-500/20",
                    icon: CheckCircle,
                };
            case "failed":
                return {
                    bg: "bg-red-500/10",
                    text: "text-red-400",
                    border: "border-red-500/20",
                    icon: AlertCircle,
                };
            case "processing":
                return {
                    bg: "bg-blue-500/10",
                    text: "text-blue-400",
                    border: "border-blue-500/20",
                    icon: Clock,
                };
            case "queued":
                return {
                    bg: "bg-amber-500/10",
                    text: "text-amber-400",
                    border: "border-amber-500/20",
                    icon: Clock,
                };
            default:
                return {
                    bg: "bg-gray-500/10",
                    text: "text-gray-400",
                    border: "border-gray-500/20",
                    icon: Clock,
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
        >
            <Icon className="w-3 h-3" />
            {status}
        </div>
    );
};

// Job preview tooltip
export interface Job {
    id: string;
    title: string;
    status: "queued" | "processing" | "completed" | "failed";
    statusDescription: string;
    healthStatus: "healthy" | "unhealthy" | "in-progress" | "waiting";
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
    progressSteps: {
        step: string;
        timestamp: string;
    }[];
    actions: {
        canRetry: boolean;
        canDelete: boolean;
    };
    error?: {
        message: string;
        code: string;
        retriable: boolean;
    };
}

interface Position {
    x: number;
    y: number;
}

interface JobPreviewProps {
    job: Job;
    isVisible: boolean;
    position: Position;
}

const JobPreview = ({ job, isVisible, position }: JobPreviewProps) => {
    if (!isVisible) return null;

    return (
        <div
            className="fixed z-50 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4 shadow-2xl pointer-events-none transition-all duration-200"
            style={{
                left: position.x + 20,
                top: position.y - 100,
                maxWidth: "320px",
            }}
        >
            <div className="space-y-3">
                {job.thumbnailUrl ? (
                    <div className="relative overflow-hidden rounded-lg">
                        <img src={job.thumbnailUrl} alt={job.title} className="w-full h-32 object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <Play className="absolute bottom-2 right-2 w-6 h-6 text-white/80" />
                    </div>
                ) : (
                    <div className="w-full h-32 bg-gray-800/50 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                            <FileText className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">No preview available</p>
                        </div>
                    </div>
                )}

                <div>
                    <h4 className="text-sm font-semibold text-white truncate">{job.title}</h4>
                    <p className="text-xs text-gray-400 mt-1">{job.fileName}</p>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{job.formattedFileSize}</span>
                    <span className="text-gray-400">{job.resolution}</span>
                </div>

                <StatusBadge status={job.status} />
            </div>
        </div>
    );
};

// Job details slide-in panel

type JobDetailsPanelProps = {
    job: Job | null;
    isOpen: boolean;
    onClose: () => void;
};

export const JobDetailsPanel: React.FC<JobDetailsPanelProps> = ({ job, isOpen, onClose }) => {
    if (!job) return null;

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleString();
    };

    const getProcessingDuration = (): string => {
        if (job.duration != null) {
            const minutes = Math.floor(job.duration / 60);
            const seconds = job.duration % 60;
            return `${minutes}m ${seconds}s`;
        }
        return "N/A";
    };

    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300" onClick={onClose} />}

            <div
                className={`fixed right-0 top-0 h-full w-full max-w-lg bg-gray-950/95 backdrop-blur-xl border-l border-gray-800/50 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
                        <h2 className="text-lg font-semibold text-white">Job Details</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Preview */}
                        {job.thumbnailUrl ? (
                            <div className="relative overflow-hidden rounded-xl">
                                <img src={job.thumbnailUrl} alt={job.title} className="w-full h-48 object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="text-lg font-semibold text-white mb-1">{job.title}</h3>
                                    <StatusBadge status={job.status} />
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-48 bg-gray-800/30 rounded-xl flex items-center justify-center border border-gray-800/50">
                                <div className="text-center">
                                    <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                                    <p className="text-gray-400">{job.title}</p>
                                    <StatusBadge status={job.status} />
                                </div>
                            </div>
                        )}

                        {/* File Info */}
                        <InfoSection
                            title="File Information"
                            icon={<FileText className="w-4 h-4" />}
                            items={[
                                ["Filename:", job.fileName],
                                ["Size:", job.formattedFileSize],
                                ["Resolution:", job.resolution],
                                ["Job Type:", <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-md text-xs">{job.jobType}</span>],
                            ]}
                        />

                        {/* Timing Info */}
                        <InfoSection
                            title="Timing"
                            icon={<Calendar className="w-4 h-4" />}
                            items={[
                                ["Created:", formatDate(job.createdAt)],
                                ...(job.completedAt ? [["Completed:", formatDate(job.completedAt)]] : []),
                                ["Age:", job.age],
                                ["Processing Time:", getProcessingDuration()],
                            ]}
                        />

                        {/* Progress */}
                        <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-800/30">
                            <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                Progress Timeline
                            </h4>
                            <div className="space-y-3">
                                {job.progressSteps.map((step, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div
                                            className={`w-2 h-2 rounded-full ${
                                                step.step === "completed"
                                                    ? "bg-emerald-400"
                                                    : step.step === "processing"
                                                    ? "bg-blue-400"
                                                    : step.step === "failed"
                                                    ? "bg-red-400"
                                                    : "bg-amber-400"
                                            }`}
                                        />
                                        <div className="flex-1 flex justify-between items-center">
                                            <span className="text-sm text-white capitalize">{step.step}</span>
                                            <span className="text-xs text-gray-400">{formatDate(step.timestamp)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tags */}
                        {job.tags?.length > 0 && (
                            <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-800/30">
                                <h4 className="text-sm font-medium text-gray-300 mb-3">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {job.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded-md text-xs border border-gray-600/30"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Error Info */}
                        {job.error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Error Details
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-400">Message:</span>
                                        <p className="text-red-300 mt-1">{job.error.message}</p>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Code:</span>
                                        <span className="text-red-300 font-mono">{job.error.code}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Retriable:</span>
                                        <span className={job.error.retriable ? "text-green-400" : "text-red-400"}>
                                            {job.error.retriable ? "Yes" : "No"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="p-6 border-t border-gray-800/50">
                        <div className="flex gap-3">
                            {job.previewUrl && (
                                <ActionButton icon={<Eye className="w-4 h-4" />} label="Preview" className="bg-blue-600 hover:bg-blue-700" />
                            )}
                            {job.status === "completed" && (
                                <ActionButton
                                    icon={<Download className="w-4 h-4" />}
                                    label="Download"
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                />
                            )}
                            {job.actions.canRetry && (
                                <ActionButton icon={<RotateCcw className="w-4 h-4" />} label="Retry" className="bg-orange-600 hover:bg-orange-700" />
                            )}
                            {job.actions.canDelete && (
                                <button className="px-4 py-2.5 text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-colors text-sm font-medium">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

// Helper components
const InfoSection = ({ title, icon, items }: { title: string; icon: React.ReactNode; items: [string, React.ReactNode][] }) => (
    <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-800/30">
        <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            {icon}
            {title}
        </h4>
        <div className="space-y-2 text-sm">
            {items.map(([label, value], idx) => (
                <div key={idx} className="flex justify-between">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-white">{value}</span>
                </div>
            ))}
        </div>
    </div>
);

const ActionButton = ({ icon, label, className }: { icon: React.ReactNode; label: string; className: string }) => (
    <button className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${className}`}>
        {icon}
        {label}
    </button>
);
// Main component
const JobsPage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedJobs, setSelectedJobs] = useState(new Set());
    const [hoveredJob, setHoveredJob] = useState<Job | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [selectedJobDetails, setSelectedJobDetails] = useState<Job | null>(null);

    // Filter jobs based on search and status
    const filteredJobs = useMemo(() => {
        return mockApiResponse.jobs.filter((job) => {
            const matchesSearch =
                job.title.toLowerCase().includes(searchQuery.toLowerCase()) || job.fileName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "all" || job.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [searchQuery, statusFilter]);

    const handleJobSelection = (jobId: string) => {
        const newSelection = new Set(selectedJobs);
        if (newSelection.has(jobId)) {
            newSelection.delete(jobId);
        } else {
            newSelection.add(jobId);
        }
        setSelectedJobs(newSelection);
    };

    const handleSelectAll = () => {
        if (selectedJobs.size === filteredJobs.length) {
            setSelectedJobs(new Set());
        } else {
            setSelectedJobs(new Set(filteredJobs.map((job) => job.id)));
        }
    };

    const handleMouseEnter = (job: Job, event: MouseEvent) => {
        setHoveredJob(job);
        setMousePosition({ x: event.clientX, y: event.clientY });
    };

    const handleMouseMove = (event: MouseEvent) => {
        setMousePosition({ x: event.clientX, y: event.clientY });
    };

    const handleMouseLeave = () => {
        setHoveredJob(null);
    };

    const handleJobClick = (job: Job) => {
        setSelectedJobDetails(job);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
            <div className="container mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Job Management</h1>
                    <p className="text-gray-400 mt-2">Monitor, manage and track all your video processing jobs</p>
                </div>

                {/* Filters and Search */}
                <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6 mb-8">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search jobs by name or filename..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-white placeholder-gray-400"
                                />
                            </div>

                            {/* Status Filter */}
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="appearance-none bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                                >
                                    <option value="all">All Status</option>
                                    <option value="completed">Completed</option>
                                    <option value="processing">Processing</option>
                                    <option value="failed">Failed</option>
                                    <option value="queued">Queued</option>
                                </select>
                                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            {selectedJobs.size > 0 && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg text-sm">
                                    <span className="text-gray-400">{selectedJobs.size} selected</span>
                                    <button className="text-red-400 hover:text-red-300 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium">
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Jobs List */}
                <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-800/30">
                                <tr>
                                    <th className="text-left p-4 text-sm font-medium text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={selectedJobs.size === filteredJobs.length && filteredJobs.length > 0}
                                            onChange={handleSelectAll}
                                            className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500/50"
                                        />
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-gray-300">Job</th>
                                    <th className="text-left p-4 text-sm font-medium text-gray-300">Status</th>
                                    <th className="text-left p-4 text-sm font-medium text-gray-300">Type</th>
                                    <th className="text-left p-4 text-sm font-medium text-gray-300">File Info</th>
                                    <th className="text-left p-4 text-sm font-medium text-gray-300">Age</th>
                                    <th className="text-left p-4 text-sm font-medium text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/30">
                                {filteredJobs.map((job) => (
                                    <tr
                                        key={job.id}
                                        className="hover:bg-gray-800/20 transition-colors group cursor-pointer"
                                        onMouseEnter={(e) => handleMouseEnter(job, e)}
                                        onMouseMove={handleMouseMove}
                                        onMouseLeave={handleMouseLeave}
                                        onClick={() => handleJobClick(job)}
                                    >
                                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedJobs.has(job.id)}
                                                onChange={() => handleJobSelection(job.id)}
                                                className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500/50"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-8 bg-gray-800/50 rounded-md flex items-center justify-center border border-gray-700/30">
                                                    <Play className="w-4 h-4 text-gray-500" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{job.title}</p>
                                                    <p className="text-sm text-gray-400 truncate max-w-xs">{job.fileName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={job.status} />
                                            {job.error && <p className="text-xs text-red-400 mt-1 truncate max-w-xs">{job.error.message}</p>}
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                {job.jobType}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm">
                                                <p className="text-gray-300">{job.formattedFileSize}</p>
                                                <p className="text-gray-500 text-xs">{job.resolution}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm text-gray-400">{job.age}</span>
                                        </td>
                                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                            <button className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty State */}
                    {filteredJobs.length === 0 && (
                        <div className="text-center py-12">
                            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                            <p className="text-gray-400 mb-2">No jobs found</p>
                            <p className="text-sm text-gray-500">Try adjusting your search or filter criteria</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {filteredJobs.length > 0 && (
                        <div className="flex items-center justify-between p-4 border-t border-gray-800/30">
                            <div className="text-sm text-gray-400">
                                Showing {filteredJobs.length} of {mockApiResponse.pagination.totalItems} jobs
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1.5 text-sm bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50">
                                    Previous
                                </button>
                                <span className="px-3 py-1.5 text-sm bg-blue-600 rounded-lg">1</span>
                                <span className="px-3 py-1.5 text-sm text-gray-400">2</span>
                                <span className="px-3 py-1.5 text-sm text-gray-400">3</span>
                                <button className="px-3 py-1.5 text-sm bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-colors">Next</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Job Preview Tooltip */}
            <JobPreview job={hoveredJob!} isVisible={!!hoveredJob} position={mousePosition} />

            {/* Job Details Panel */}
            <JobDetailsPanel job={selectedJobDetails} isOpen={!!selectedJobDetails} onClose={() => setSelectedJobDetails(null)} />
        </div>
    );
};

export default JobsPage;
