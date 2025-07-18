import React from "react";
import { Search, Filter, Trash2, Download } from "lucide-react";
import { useJobStore } from "@/store/jobStore";

const JobsFilter: React.FC = () => {
    const { searchQuery, statusFilter, selectedJobs, setSearchQuery, setStatusFilter, clearSelection } = useJobStore();

    return (
        <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search jobs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-800/30 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>

                {/* Status Filter */}
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-10 pr-8 py-2 bg-gray-800/30 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedJobs.size > 0 && (
                <div className="flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <span className="text-sm text-blue-400">
                        {selectedJobs.size} job{selectedJobs.size > 1 ? "s" : ""} selected
                    </span>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button
                            onClick={clearSelection}
                            className="px-3 py-1.5 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded-lg transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobsFilter;
