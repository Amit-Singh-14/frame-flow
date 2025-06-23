import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useSession } from "@/context/SessionContext";
import { api, API_ENDPOINTS } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Upload, Clock, CheckCircle, XCircle, TrendingUp, Activity, FileVideo, ArrowRight, Zap, BarChart3, Badge } from "lucide-react";
import { queryKeys } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ROUTES } from "@/utils/constants";

interface DashboardStats {
    user: {
        total: number;
        pending: number;
        processing: number;
        completed: number;
        failed: number;
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

interface RecentJob {
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
    const navigate = useNavigate();
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

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "completed":
                return "bg-green-500";
            case "processing":
                return "bg-blue-500";
            case "pending":
                return "bg-yellow-500";
            case "failed":
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    const getHealthStatusColor = (health: string) => {
        switch (health.toLowerCase()) {
            case "healthy":
                return "text-green-400";
            case "warning":
                return "text-yellow-400";
            case "critical":
                return "text-red-400";
            default:
                return "text-gray-400";
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-black p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 bg-blue-900/20 backdrop-blur-md rounded-xl animate-pulse border border-blue-800/30" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-black p-6">
                <div className="max-w-7xl mx-auto">
                    <Card className="bg-red-500/20 border-red-500/30">
                        <CardContent className="p-6 text-center">
                            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                            <p className="text-red-200">Failed to load dashboard data</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const stats = dashboardData?.stats;

    return (
        <div className="min-h-screen bg-black p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                        Video Processing Dashboard
                    </h1>
                    <p className="text-blue-200 text-lg">
                        Session: <span className="text-cyan-300 font-mono">{sessionId}</span>
                    </p>
                </div>

                {/* Quick Action */}
                <div className="flex justify-center">
                    <Button
                        onClick={() => navigate(ROUTES.UPLOAD)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-md hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-300 flex items-center"
                    >
                        <Upload className="w-6 h-6 mr-2" />
                        Upload New Video
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Jobs */}
                    <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <CardHeader className="pb-2 relative z-10">
                            <CardTitle className="text-white/80 text-sm font-medium flex items-center">
                                <FileVideo className="w-4 h-4 mr-2 text-blue-400" />
                                Total Jobs
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold text-white mb-2">{stats?.user.total || 0}</div>
                            <div className="flex items-center text-green-400 text-sm">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                All time
                            </div>
                        </CardContent>
                    </Card>

                    {/* Completed Jobs */}
                    <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <CardHeader className="pb-2 relative z-10">
                            <CardTitle className="text-white/80 text-sm font-medium flex items-center">
                                <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                                Completed
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold text-white mb-2">{stats?.user.completed || 0}</div>
                            <div className="text-green-400 text-sm">{stats?.successRate?.toFixed(1) || 0}% success rate</div>
                        </CardContent>
                    </Card>

                    {/* Processing Jobs */}
                    <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <CardHeader className="pb-2 relative z-10">
                            <CardTitle className="text-white/80 text-sm font-medium flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-yellow-400" />
                                In Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold text-white mb-2">{stats?.user.pending || 0}</div>
                            <div className="text-yellow-400 text-sm flex items-center">
                                <Activity className="w-4 h-4 mr-1" />
                                Processing
                            </div>
                        </CardContent>
                    </Card>

                    {/* Storage Used */}
                    <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-700/20 to-slate-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <CardHeader className="pb-2 relative z-10">
                            <CardTitle className="text-white/80 text-sm font-medium flex items-center">
                                <BarChart3 className="w-4 h-4 mr-2 text-purple-400" />
                                Storage Used
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-3xl font-bold text-white mb-2">{stats?.user.failed || "0 B"}</div>
                            <div className="text-purple-400 text-sm">Total usage</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Jobs */}
                    <div className="lg:col-span-2">
                        <Card className="bg-white/5 backdrop-blur-xl border-white/10 h-full">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center justify-between">
                                    <span className="flex items-center">
                                        <Clock className="w-5 h-5 mr-2 text-blue-400" />
                                        Recent Jobs
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate(ROUTES.JOBS)}
                                        className="text-purple-300 hover:text-white hover:bg-white/10"
                                    >
                                        View All
                                        <ArrowRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {dashboardData && dashboardData?.recentJobs?.length > 0 ? (
                                    dashboardData.recentJobs.slice(0, 5).map((job) => (
                                        <div
                                            key={job.id}
                                            className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                                            onClick={() => navigate(ROUTES.JOB_DETAIL(job.id))}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className={`w-3 h-3 rounded-full ${getStatusColor(job.status)}`} />
                                                <div>
                                                    <p className="text-white font-medium truncate max-w-[200px]">{job.input_file}</p>
                                                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                                                        <span>{job.formattedFileSize}</span>
                                                        <span>•</span>
                                                        <span>{job.age}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <Badge className={`${getStatusColor(job.status)} text-white border-0`}>{job.statusDescription}</Badge>
                                                <div className={`text-sm ${getHealthStatusColor(job.healthStatus)}`}>
                                                    <Activity className="w-4 h-4" />
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <FileVideo className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                        <p className="text-gray-400">No jobs yet. Upload your first video!</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* System Health & Quick Stats */}
                    <div className="space-y-6">
                        {/* System Health */}
                        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border-green-500/20">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center">
                                    <Zap className="w-5 h-5 mr-2 text-green-400" />
                                    System Health
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Jobs Summary */}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Total Jobs</span>
                                    <span className="text-white font-bold">{stats?.monitoring?.totalJobs ?? 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Queued / Processing</span>
                                    <span className="text-white font-bold">
                                        {stats?.queue?.queued ?? 0} / {stats?.queue?.processing ?? 0}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Healthy Jobs</span>
                                    <span className="text-green-400 font-bold">{stats?.monitoring?.healthyJobs ?? 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Unhealthy Jobs</span>
                                    <span className="text-yellow-400 font-bold">{stats?.monitoring?.unhealthyJobs ?? 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Stuck Jobs</span>
                                    <span className="text-red-400 font-bold">{stats?.monitoring?.stuckJobs ?? 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Orphaned Files</span>
                                    <span className="text-white font-bold">{stats?.monitoring?.orphanedFiles ?? 0}</span>
                                </div>

                                {/* Service Info */}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Service Status</span>
                                    <span className={`font-bold ${stats?.service?.initialized ? "text-green-400" : "text-red-500"}`}>
                                        {stats?.service?.initialized ? "🟢 Initialized" : "🔴 Not Initialized"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Service Version</span>
                                    <span className="text-white font-bold">{stats?.service?.version ?? "N/A"}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Last Monitor Run</span>
                                    <span className="text-white font-mono text-sm">
                                        {(stats?.monitoring.lastMonitorRun && new Date(stats?.monitoring.lastMonitorRun).toLocaleString()) || "N/A"}
                                    </span>
                                </div>

                                <div className="pt-2 border-t border-white/10">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate(ROUTES.MONITORING)}
                                        className="w-full text-green-300 hover:text-white hover:bg-white/10"
                                    >
                                        View Monitoring
                                        <ArrowRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Performance Stats */}
                        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border-purple-500/20">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center">
                                    <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
                                    Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Success Rate</span>
                                    <span className="text-green-400 font-bold">{stats?.successRate?.toFixed(1) || 0}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Avg Processing</span>
                                    <span className="text-blue-400 font-bold">{stats?.averageProcessingTime || 0}min</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Failed Jobs</span>
                                    <span className="text-red-400 font-bold">{stats?.failedJobs || 0}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
