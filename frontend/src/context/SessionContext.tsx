import { queryKeys } from "@/lib/queryClient";
import api, { API_ENDPOINTS } from "@/services/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface User {
    id: string;
    sessionId: string;
    createdAt: string;
}

interface SessionContextType {
    user: User | undefined;
    sessionId: string | null;
    isLoading: boolean;
    error: Error | null;
    createSession: () => void;
    clearSession: () => void;
    refreshUser: () => void;
}

// create context
const SessionContext = createContext<SessionContextType | undefined>(undefined);

// user api functions

const createSessionApi = async (): Promise<User> => {
    const response = await api.post(API_ENDPOINTS.createSession);
    return response.data.user;
};

const getCurrentUserAPI = async (): Promise<User> => {
    const response = await api.get(API_ENDPOINTS.getCurrentUser);
    return response.data.user;
};

// Session Provider Component
interface SessionProviderProps {
    children: ReactNode;
}

export const SessionProvider = ({ children }: SessionProviderProps) => {
    const [sessionId, setSessionId] = useState<string | null>(() => {
        return localStorage.getItem("sessionId");
    });

    const queryClient = useQueryClient();

    // query to get current user details
    const {
        data: user,
        isLoading,
        error,
        refetch: refetchUser,
    } = useQuery({
        queryKey: queryKeys.currentUser(),
        queryFn: getCurrentUserAPI,
        enabled: !!sessionId,
        staleTime: 5 * 60 * 1000,
        retry: false,
    });

    // mutation to create new session
    const createSessionMutation = useMutation({
        mutationFn: createSessionApi,
        onSuccess: (newUser) => {
            setSessionId(newUser.sessionId);
            localStorage.setItem("sessionId", newUser.sessionId);

            // update query cache
            queryClient.setQueryData(queryKeys.currentUser(), newUser);
        },
        onError: (error) => {
            console.error("Failed to create Session", error);
            clearSession();
        },
    });

    // auto create session of none exists
    useEffect(() => {
        if (!sessionId && !createSessionMutation.isPending) {
            createSessionMutation.mutate();
        }
    }, [sessionId, createSessionMutation]);

    // auto refresh user data periodically
    useEffect(() => {
        if (!sessionId || !user) return;

        const interval = setInterval(() => {
            refetchUser();
        }, 30 * 60 * 1000); // Check every 30 minutes

        return () => clearInterval(interval);
    }, [sessionId, user, refetchUser]);

    const clearSession = () => {
        setSessionId(null);
        localStorage.removeItem("sessionId");
        queryClient.removeQueries({ queryKey: ["user"] });
        queryClient.removeQueries({ queryKey: ["jobs"] });
    };

    const createSession = () => {
        createSessionMutation.mutate();
    };

    const refreshUser = () => {
        refetchUser();
    };

    const contextValue: SessionContextType = {
        user,
        sessionId,
        isLoading: isLoading || createSessionMutation.isPending,
        error: error || createSessionMutation.error,
        createSession,
        clearSession,
        refreshUser,
    };

    return <SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>;
};

// custom hook to use Session context
export const useSession = (): SessionContextType => {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error("use Session must be used within a SessionProvider");
    }
    return context;
};
