import type { ItemData } from "@/types/jobs";
import { FileText } from "lucide-react";
import React from "react";

export const VirtualJobRow = React.memo<{
    index: number;
    style: React.CSSProperties;
    data: ItemData;
}>(({ index, style, data }) => {
    const { jobs, selectedJobs, onJobSelect, onJobClick, onMouseEnter, onMouseMove, onMouseLeave } = data;

    const job = jobs[index];

    if (!job) return null;

    return (
        <div style={style} className="px-4">
            <div className="h-full flex items-center border-b border-gray-800/30">
                <div className="w-12 flex justify-center">
                    <input
                        type="checkbox"
                        checked={selectedJobs.has(job.id)}
                        onChange={() => onJobSelect(job.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500/50"
                    />
                </div>
                <div
                    className="flex-1 grid grid-cols-6 gap-4 items-center cursor-pointer hover:bg-gray-800/20 transition-colors rounded-lg p-2"
                    onClick={() => onJobClick(job)}
                    onMouseEnter={(e) => onMouseEnter(job, e)}
                    onMouseMove={onMouseMove}
                    onMouseLeave={onMouseLeave}
                >
                    {/* Job Info */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-8 bg-gray-800/50 rounded-md flex items-center justify-center border border-gray-700/30">
                            <FileText className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-medium text-white truncate">{job.title}</p>
                            <p className="text-sm text-gray-400 truncate">{job.fileName}</p>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                                job.status === "completed"
                                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                    : job.status === "processing"
                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                    : job.status === "failed"
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                    : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            }`}
                        >
                            {job.status}
                        </span>
                        {job.error && <p className="text-xs text-red-400 mt-1 truncate">{job.error.message}</p>}
                    </div>

                    {/* Type */}
                    <div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            {job.jobType}
                        </span>
                    </div>

                    {/* File Info */}
                    <div className="text-sm">
                        <p className="text-gray-300">{job.formattedFileSize}</p>
                        <p className="text-gray-500 text-xs">{job.resolution}</p>
                    </div>

                    {/* Age */}
                    <div>
                        <span className="text-sm text-gray-400">{job.age}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end">
                        <button
                            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                // Handle actions menu
                            }}
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

VirtualJobRow.displayName = "VirtualJobRow";
