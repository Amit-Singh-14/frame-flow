import React, { useMemo } from "react";
import { StatusBadge } from "./StatusBadge";
import { FileText, MoreHorizontal, Play } from "lucide-react";
import type { Job } from "@/types";
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

interface JobListProps {
    setHoveredJob: React.Dispatch<React.SetStateAction<Job | null>>;
    setMousePosition: React.Dispatch<
        React.SetStateAction<{
            x: number;
            y: number;
        }>
    >;
    setSelectedJobDetails: React.Dispatch<React.SetStateAction<Job | null>>;
    setSelectedJobs: React.Dispatch<React.SetStateAction<Set<unknown>>>;
    selectedJobs: Set<unknown>;
    searchQuery: string;
    statusFilter: string;
}
function JobList({ searchQuery, setSelectedJobs, selectedJobs, setHoveredJob, setMousePosition, setSelectedJobDetails, statusFilter }: JobListProps) {
    // Filter jobs based on search and status
    const filteredJobs = useMemo(() => {
        return mockApiResponse.jobs.filter((job) => {
            const matchesSearch =
                job.title.toLowerCase().includes(searchQuery.toLowerCase()) || job.fileName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "all" || job.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [searchQuery, statusFilter]);

    const handleMouseEnter = (job: Job, event: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => {
        setHoveredJob(job);
        setMousePosition({ x: event.clientX, y: event.clientY });
    };

    const handleMouseMove = (event: React.MouseEvent<HTMLTableRowElement, MouseEvent>) => {
        setMousePosition({ x: event.clientX, y: event.clientY });
    };

    const handleMouseLeave = () => {
        setHoveredJob(null);
    };

    const handleJobClick = (job: Job) => {
        setSelectedJobDetails(job);
    };

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
    return (
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
                                onMouseEnter={(e) => handleMouseEnter(job as Job, e)}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                                onClick={() => handleJobClick(job as Job)}
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
    );
}

export default JobList;
