/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
            retry: (failureCount, error: any) => {
                // Don't retry on 4xx errors except 429 (rate limit)
                if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 429) {
                    return false;
                }
                return failureCount < 3;
            },
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
        },
        mutations: {
            retry: (failureCount, error: any) => {
                // Don't retry mutations on client errors
                if (error?.response?.status >= 400 && error?.response?.status < 500) {
                    return false;
                }
                return failureCount < 2;
            },
        },
    },
});

export const queryKeys = {
    // user keys
    currentUser: () => ["user", "current"] as const,
    usersStats: (userId: string) => ["user", userId, "stats"] as const,

    // job keys
    jobs: (userId: string, filters?: Record<string, any>) => ["jobs", userId, filters] as const,
    job: (jobId: string) => ["job", jobId] as const,

    // monitoring keys
    // TODO: add all the key for job and monitoring
} as const;
