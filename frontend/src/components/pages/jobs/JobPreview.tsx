import { FileText, Play } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { Job } from "@/types";

interface JobPreviewProps {
    job: Job;
    isVisible: boolean;
    position: Position;
}
interface Position {
    x: number;
    y: number;
}

export const JobPreview = ({ job, isVisible, position }: JobPreviewProps) => {
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
