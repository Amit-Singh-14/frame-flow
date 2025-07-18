import { useSession } from "@/context/SessionContext";
import { queryKeys } from "@/lib/queryClient";
import api, { API_ENDPOINTS } from "@/services/api";
import { useJobStore } from "@/store/jobStore";
import type { JobsResponse } from "@/types/jobs";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

export const useJobsData = () => {
    const { sessionId } = useSession();

    const { searchQuery, statusFilter, currentPage, itemsPerPage } = useJobStore();

    // Debounced search query for better performance
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const queryParams = useMemo(
        () => ({
            search: debouncedSearchQuery,
            status: statusFilter === "all" ? undefined : statusFilter,
            page: currentPage,
            limit: itemsPerPage,
        }),
        [debouncedSearchQuery, statusFilter, currentPage, itemsPerPage]
    );

    const { data, isLoading, error, refetch } = useQuery<JobsResponse>({
        queryKey: queryKeys.jobs(sessionId!, queryParams),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (queryParams.search) params.append("search", queryParams.search);
            if (queryParams.status) params.append("status", queryParams.status);
            params.append("page", queryParams.page.toString());
            params.append("limit", queryParams.limit.toString());

            const response = await api.get(`${API_ENDPOINTS.jobs}?${params}`);
            return response.data;
        },
        enabled: !!sessionId,
        staleTime: 30000,
        refetchOnWindowFocus: false,
    });

    return {
        jobs: data?.jobs || [],
        pagination: data?.pagination,
        isLoading,
        error,
        refetch,
    };
};

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
