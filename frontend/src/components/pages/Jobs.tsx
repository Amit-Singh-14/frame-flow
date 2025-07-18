import React from "react";
import JobsFilter from "./jobs/JobsFilter";
import VirtualizedJobList from "./jobs/VirtualizedJobList";
import { JobDetailsPanel } from "./jobs/JobDetailsPanel";
import { useJobStore } from "@/store/jobStore";

const JobsPage: React.FC = () => {
    const { selectedJobDetails, setSelectedJobDetails } = useJobStore();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
            <div className="container relative mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Job Management</h1>
                    <p className="text-gray-400 mt-2">Monitor, manage and track all your video processing jobs</p>
                </div>

                {/* Filter */}
                <JobsFilter />

                {/* Jobs List */}
                <VirtualizedJobList />

                {/* Job Details Panel */}
                <JobDetailsPanel job={selectedJobDetails} isOpen={!!selectedJobDetails} onClose={() => setSelectedJobDetails(null)} />
            </div>
        </div>
    );
};

export default JobsPage;
