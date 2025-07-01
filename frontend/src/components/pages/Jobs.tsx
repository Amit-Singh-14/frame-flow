import { useState } from "react";
import { JobPreview } from "./jobs/JobPreview";
import JobsFilter from "./jobs/JobsFilter";
import JobList from "./jobs/JobList";
import { JobDetailsPanel } from "./jobs/JobDetailsPanel";
import type { Job } from "@/types";

// Main component
const JobsPage = () => {
    const [selectedJobs, setSelectedJobs] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [hoveredJob, setHoveredJob] = useState<Job | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [selectedJobDetails, setSelectedJobDetails] = useState<Job | null>(null);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
            <div className="container mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Job Management</h1>
                    <p className="text-gray-400 mt-2">Monitor, manage and track all your video processing jobs</p>
                </div>

                {/* Filters and Search */}
                <JobsFilter
                    searchQuery={searchQuery}
                    selectedJobs={selectedJobs}
                    setSearchQuery={setSearchQuery}
                    setStatusFilter={setStatusFilter}
                    statusFilter={statusFilter}
                />

                {/* Jobs List */}
                <JobList
                    searchQuery={searchQuery}
                    selectedJobs={selectedJobs}
                    setHoveredJob={setHoveredJob}
                    setMousePosition={setMousePosition}
                    setSelectedJobDetails={setSelectedJobDetails}
                    setSelectedJobs={setSelectedJobs}
                    statusFilter={statusFilter}
                />
            </div>

            {/* Job Preview Tooltip */}
            <JobPreview job={hoveredJob!} isVisible={!!hoveredJob} position={mousePosition} />

            {/* Job Details Panel */}
            <JobDetailsPanel job={selectedJobDetails} isOpen={!!selectedJobDetails} onClose={() => setSelectedJobDetails(null)} />
        </div>
    );
};

export default JobsPage;
