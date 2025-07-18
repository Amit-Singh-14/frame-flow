import { useJobsData } from "@/hooks/useJobsData";
import { useJobStore } from "@/store/jobStore";
import type { ItemData, Job } from "@/types/jobs";
import React, { useCallback, useMemo, useState } from "react";
import { FixedSizeList as List } from "react-window";
import { FileText } from "lucide-react";
import AutoSizer from "react-virtualized-auto-sizer";
import { VirtualJobRow } from "./JobRow";
import { JobPreview } from "./JobPreview";

const ITEM_HEIGHT = 80;
const CONTAINER_HEIGHT = 600;

interface VirtualizedJobListProps {
    className?: string;
}

const VirtualizedJobList: React.FC<VirtualizedJobListProps> = ({ className }) => {
    const { jobs, isLoading, error } = useJobsData();

    const { selectedJobs, toggleJobSelection, selectAllJobs, clearSelection, setHoveredJob, setSelectedJobDetails, areAllJobsSelected, hoveredJob } =
        useJobStore();

    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Memoize event handlers
    const handleJobSelect = useCallback(
        (jobId: string) => {
            toggleJobSelection(jobId);
        },
        [toggleJobSelection]
    );

    const handleJobClick = useCallback(
        (job: Job) => {
            setSelectedJobDetails(job);
        },
        [setSelectedJobDetails]
    );

    const handleMouseEnter = useCallback(
        (job: Job, event: React.MouseEvent) => {
            setHoveredJob(job);
            setMousePosition({ x: event.clientX, y: event.clientY });
        },
        [setHoveredJob]
    );

    const handleMouseMove = throttle((event: React.MouseEvent) => {
        setMousePosition({ x: event.clientX, y: event.clientY });
    }, 3000);

    const handleMouseLeave = useCallback(() => {
        setHoveredJob(null);
    }, [setHoveredJob]);

    const handleSelectAll = useCallback(() => {
        if (areAllJobsSelected(jobs.length)) {
            clearSelection();
        } else {
            selectAllJobs(jobs.map((job) => job.id));
        }
    }, [areAllJobsSelected, jobs, clearSelection, selectAllJobs]);

    // Memoize item data to prevent unnecessary re-renders
    const itemData = useMemo<ItemData>(
        () => ({
            jobs,
            selectedJobs,
            onJobSelect: handleJobSelect,
            onJobClick: handleJobClick,
            onMouseEnter: handleMouseEnter,
            onMouseMove: handleMouseMove,
            onMouseLeave: handleMouseLeave,
        }),
        [jobs, selectedJobs, handleJobSelect, handleJobClick, handleMouseEnter, handleMouseMove, handleMouseLeave]
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64 bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-xl">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-400">Loading jobs...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-xl">
                <div className="text-red-400 mb-2">Error loading jobs</div>
                <p className="text-sm text-gray-500">Please try refreshing the page</p>
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-xl">
                <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No jobs found</p>
                <p className="text-sm text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
        );
    }
    return (
        <div className={`relative  bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-xl ${className}`}>
            {/* Job Preview Tooltip */}

            <JobPreview job={hoveredJob} isVisible={!!hoveredJob} position={mousePosition} />

            {/* Table Header */}
            <div className="bg-gray-800/30 px-4 py-3 border-b border-gray-800/30 sticky top-0 z-10">
                <div className="flex items-center">
                    <div className="w-12 flex justify-center">
                        <input
                            type="checkbox"
                            checked={areAllJobsSelected(jobs.length)}
                            onChange={handleSelectAll}
                            className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500/50"
                        />
                    </div>
                    <div className="flex-1 grid grid-cols-6 gap-4 text-sm font-medium text-gray-300">
                        <span>Job</span>
                        <span>Status</span>
                        <span>Type</span>
                        <span>File Info</span>
                        <span>Age</span>
                        <span>Actions</span>
                    </div>
                </div>
            </div>

            {/* Virtualized List Container */}
            <div className="relative" style={{ height: CONTAINER_HEIGHT }}>
                <AutoSizer>
                    {({ height, width }) => (
                        <List
                            height={height}
                            width={width}
                            itemCount={jobs.length}
                            itemSize={ITEM_HEIGHT}
                            itemData={itemData}
                            overscanCount={5}
                            className="scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
                        >
                            {VirtualJobRow}
                        </List>
                    )}
                </AutoSizer>
            </div>
            {/* Footer with job count */}
            <div className="bg-gray-800/30 px-4 py-3 border-t border-gray-800/30">
                <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Showing {jobs.length} jobs</span>
                    {selectedJobs.size > 0 && <span>{selectedJobs.size} selected</span>}
                </div>
            </div>
        </div>
    );
};

export default VirtualizedJobList;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function throttle<T extends (...args: any[]) => void>(func: T, limit: number): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    let lastArgs: Parameters<T> | null = null;

    return function (...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;

            setTimeout(() => {
                inThrottle = false;
                if (lastArgs) {
                    func(...lastArgs);
                    lastArgs = null;
                }
            }, limit);
        } else {
            lastArgs = args; // Save the latest arguments
        }
    };
}
