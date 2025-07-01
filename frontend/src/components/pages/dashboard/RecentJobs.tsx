import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/utils/constants";
import { Activity, ArrowRight, Badge, Clock, FileVideo } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { RecentJob } from "../Dashboard";

function RecentJobs({ recentJobs }: { recentJobs: RecentJob[] }) {
    const navigate = useNavigate();

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
    return (
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
                    {recentJobs.length > 0 ? (
                        recentJobs.slice(0, 5).map((job) => (
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
    );
}

export default RecentJobs;
