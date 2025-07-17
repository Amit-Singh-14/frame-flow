import { FileText, Play } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { Job } from "@/types/jobs";
import { useEffect, useRef, useState } from "react";

interface JobPreviewProps {
    job: Job | null;
    isVisible: boolean;
    position: { x: number; y: number };
}

export const JobPreview = ({ job, isVisible, position }: JobPreviewProps) => {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    console.log("sdasd");
    useEffect(() => {
        if (!isVisible || !job) return;

        const offsetX = -100;
        const offsetY = -200;

        let x = position.x + offsetX;
        let y = position.y + offsetY;

        const tooltipEl = tooltipRef.current;
        if (tooltipEl) {
            const { innerWidth, innerHeight } = window;
            const rect = tooltipEl.getBoundingClientRect();

            if (x + rect.width > innerWidth) x = innerWidth - rect.width - 10;
            if (y + rect.height > innerHeight) y = innerHeight - rect.height - 10;
        }

        // Smoothly animate towards new position
        requestAnimationFrame(() => {
            setTooltipPos({ x, y });
        });
    }, [position, isVisible, job]);

    if (!isVisible || !job) return null;

    return (
        <div
            ref={tooltipRef}
            className={`fixed z-50 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4 shadow-2xl pointer-events-none transition-opacity duration-200 ease-in-out ${
                isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
            style={{
                left: tooltipPos.x,
                top: tooltipPos.y,
                position: "fixed",
                maxWidth: "320px",
                transition: "left 150ms ease, top 150ms ease, opacity 200ms ease",
            }}
        >
            <div className="space-y-3">
                {job.thumbnailUrl ? (
                    <div className="relative overflow-hidden rounded-lg">
                        <img src={job.thumbnailUrl} alt={job.title || "Thumbnail"} className="w-full h-32 object-cover rounded" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
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
                    <p className="text-xs text-gray-400 mt-1 truncate">{job.fileName}</p>
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
