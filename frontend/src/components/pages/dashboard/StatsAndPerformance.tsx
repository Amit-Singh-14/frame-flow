import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/utils/constants";
import { ArrowRight, TrendingUp, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { DashboardStats } from "../Dashboard";

function StatsAndPerformance({ stats }: { stats: DashboardStats }) {
    const navigate = useNavigate();

    return (
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
    );
}

export default StatsAndPerformance;
