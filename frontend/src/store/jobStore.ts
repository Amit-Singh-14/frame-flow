import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Job } from "@/types/jobs";

interface JobState {
    // Filter state
    searchQuery: string;
    statusFilter: string;
    selectedJobs: Set<string>;

    // pagination state
    currentPage: number;
    itemsPerPage: number;

    // UI state
    hoveredJob: Job | null;
    selectedJobDetails: Job | null;

    // Actions
    setSearchQuery: (query: string) => void;
    setStatusFilter: (status: string) => void;
    setSelectedJobs: (jobs: Set<string>) => void;
    toggleJobSelection: (jobId: string) => void;
    selectAllJobs: (jobIds: string[]) => void;
    clearSelection: () => void;
    setCurrentPage: (page: number) => void;
    setItemsPerPage: (limit: number) => void;
    setHoveredJob: (job: Job | null) => void;
    setSelectedJobDetails: (job: Job | null) => void;

    // Computed values
    getFilteredJobsCount: () => number;
    isJobSelected: (jobId: string) => boolean;
    areAllJobsSelected: (totalJobs: number) => boolean;
}

export const useJobStore = create<JobState>()(
    devtools(
        (set, get) => ({
            // Initial state
            searchQuery: "",
            statusFilter: "all",
            selectedJobs: new Set(),
            currentPage: 1,
            itemsPerPage: 50,
            hoveredJob: null,
            selectedJobDetails: null,

            // Actions
            setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
            setStatusFilter: (status) => set({ statusFilter: status, currentPage: 1 }),
            setSelectedJobs: (jobs) => set({ selectedJobs: jobs }),

            toggleJobSelection: (jobId) =>
                set((state) => {
                    const newSelection = new Set(state.selectedJobs);
                    if (newSelection.has(jobId)) {
                        newSelection.delete(jobId);
                    } else {
                        newSelection.add(jobId);
                    }
                    return { selectedJobs: newSelection };
                }),

            selectAllJobs: (jobIds) => set({ selectedJobs: new Set(jobIds) }),
            clearSelection: () => set({ selectedJobs: new Set() }),
            setCurrentPage: (page) => set({ currentPage: page }),
            setItemsPerPage: (limit) => set({ itemsPerPage: limit }),
            setHoveredJob: (job) => set({ hoveredJob: job }),
            setSelectedJobDetails: (job) => set({ selectedJobDetails: job }),

            // Computed values
            getFilteredJobsCount: () => get().selectedJobs.size,
            isJobSelected: (jobId) => get().selectedJobs.has(jobId),
            areAllJobsSelected: (totalJobs) => {
                const { selectedJobs } = get();
                return totalJobs > 0 && selectedJobs.size === totalJobs;
            },
        }),
        {
            name: "jobs-store",
        }
    )
);
