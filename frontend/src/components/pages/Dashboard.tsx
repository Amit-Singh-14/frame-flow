import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/context/SessionContext";
import { api, API_ENDPOINTS } from "@/services/api";
import { Clock, CheckCircle, TrendingUp, Activity, FileVideo, BarChart3 } from "lucide-react";
import { queryKeys } from "@/lib/queryClient";
import { formatFileSize } from "@/utils/constants";
import DashLoading from "./dashboard/DashLoading";
import DashError from "./dashboard/DashError";
import DashHeader from "./dashboard/DashHeader";
import DashUploadBtn from "./dashboard/DashUploadBtn";
import { StatCard } from "./dashboard/StatsCard";
import RecentJobs from "./dashboard/RecentJobs";
import StatsAndPerformance from "./dashboard/StatsAndPerformance";

export interface DashboardStats {
    user: {
        total: number;
        pending: number;
        processing: number;
        completed: number;
        failed: number;
        totalStorage: number;
    };
    queue: {
        queued: number;
        processing: number;
        totalInProgress: number;
    };
    monitoring: {
        totalJobs: number;
        healthyJobs: number;
        unhealthyJobs: number;
        stuckJobs: number;
        orphanedFiles: number;
        lastMonitorRun: string;
    };
    service: {
        initialized: boolean;
        version: string;
    };
}

export interface RecentJob {
    id: string;
    input_file: string;
    status: string;
    created_at: string;
    age: string;
    statusDescription: string;
    healthStatus: string;
    formattedFileSize: string;
    file_size: number;
}

interface DashboardData {
    success: boolean;
    stats: DashboardStats;
    recentJobs: RecentJob[];
}

const Dashboard: React.FC = () => {
    const { sessionId } = useSession();
    console.log(sessionId);

    const {
        data: dashboardData,
        isLoading,
        error,
    } = useQuery<DashboardData>({
        queryKey: queryKeys.usersStats(sessionId || ""),
        queryFn: async () => {
            const response = await api.get(API_ENDPOINTS.stats);
            return response.data;
        },
        enabled: !!sessionId,
        refetchInterval: 100000, // Refetch every 100 seconds
    });

    if (isLoading) {
        return <DashLoading />;
    }

    if (error) {
        return <DashError />;
    }

    const stats = dashboardData?.stats;

    return (
        <div className="min-h-screen bg-black p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <DashHeader />

                {/* Quick Action */}
                <DashUploadBtn />

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon={<FileVideo className="w-4 h-4 mr-2 text-blue-400" />}
                        title="Total Jobs"
                        value={stats?.user.total || 0}
                        subtext={
                            <span className="flex items-center text-green-400">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                All time
                            </span>
                        }
                        gradient="bg-gradient-to-br from-blue-500/20 to-purple-500/20"
                    />

                    <StatCard
                        icon={<CheckCircle className="w-4 h-4 mr-2 text-green-400" />}
                        title="Completed"
                        value={stats?.user.completed || 0}
                        subtext={<span className="text-green-400">{stats?.queue.processing || 0}% success rate</span>}
                        gradient="bg-gradient-to-br from-green-500/20 to-emerald-500/20"
                    />

                    <StatCard
                        icon={<Clock className="w-4 h-4 mr-2 text-yellow-400" />}
                        title="In Progress"
                        value={stats?.user.pending || 0}
                        subtext={
                            <span className="flex items-center text-yellow-400">
                                <Activity className="w-4 h-4 mr-1" />
                                Processing
                            </span>
                        }
                        gradient="bg-gradient-to-br from-yellow-500/20 to-orange-500/20"
                    />

                    <StatCard
                        icon={<BarChart3 className="w-4 h-4 mr-2 text-purple-400" />}
                        title="Storage Used"
                        value={stats?.user.totalStorage ? formatFileSize(stats.user.totalStorage) : "0 B"}
                        subtext={<span className="text-purple-400">Total usage</span>}
                        gradient="bg-gradient-to-br from-slate-700/20 to-slate-500/20"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Jobs */}
                    {dashboardData?.recentJobs && <RecentJobs recentJobs={dashboardData?.recentJobs} />}

                    {/* System Health & Quick Stats */}
                    {dashboardData?.stats && <StatsAndPerformance stats={dashboardData?.stats} />}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
