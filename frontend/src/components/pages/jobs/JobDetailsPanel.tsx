// Job details slide-in panel

import { AlertCircle, Calendar, Download, Eye, FileText, RotateCcw, Trash2, X, Zap } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { InfoSection } from "./InfoSection";
import { ActionButton } from "./ActionButton";
import type { Job } from "@/types";

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
                                ["Age:", job.age],
                                ["Processing Time:", getProcessingDuration()],
                                ...(job.completedAt ? [["Completed:", formatDate(job.completedAt)] as [string, React.ReactNode]] : []),
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
