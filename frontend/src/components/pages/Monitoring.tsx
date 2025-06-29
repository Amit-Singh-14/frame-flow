import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import {
    Activity,
    Server,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Pause,
    Play,
    RefreshCw,
    Trash2,
    Settings,
    Cpu,
    Users,
    TrendingUp,
    Eye,
    Bell,
    Database,
    Monitor,
} from "lucide-react";

const monitoringMockData = {
    systemStats: {
        cpuUsage: 67.5, // in %
        memoryUsage: 72.3, // in %
        diskUsage: 81.1, // in %
        queueSize: 14,
        activeWorkers: 5,
        totalWorkers: 6,
        lastUpdated: "2025-06-23T14:32:10Z",
    },
    jobTrends: {
        jobsPerMinute: [
            { timestamp: "14:00", count: 5 },
            { timestamp: "14:05", count: 8 },
            { timestamp: "14:10", count: 4 },
            { timestamp: "14:15", count: 10 },
            { timestamp: "14:20", count: 6 },
            { timestamp: "14:25", count: 12 },
        ],
        averageProcessingTime: [
            { timestamp: "14:00", seconds: 45 },
            { timestamp: "14:05", seconds: 50 },
            { timestamp: "14:10", seconds: 39 },
            { timestamp: "14:15", seconds: 61 },
            { timestamp: "14:20", seconds: 55 },
            { timestamp: "14:25", seconds: 49 },
        ],
        failureRate: [
            { timestamp: "14:00", percentage: 5 },
            { timestamp: "14:05", percentage: 3 },
            { timestamp: "14:10", percentage: 7 },
            { timestamp: "14:15", percentage: 2 },
            { timestamp: "14:20", percentage: 6 },
            { timestamp: "14:25", percentage: 4 },
        ],
    },
    workerStatus: [
        {
            id: "worker-01",
            status: "online",
            jobsInProgress: 2,
            cpuLoad: 68,
            lastSeen: "2025-06-23T14:31:45Z",
        },
        {
            id: "worker-02",
            status: "online",
            jobsInProgress: 1,
            cpuLoad: 52,
            lastSeen: "2025-06-23T14:31:50Z",
        },
        {
            id: "worker-03",
            status: "offline",
            jobsInProgress: 0,
            cpuLoad: null,
            lastSeen: "2025-06-23T13:59:05Z",
        },
        {
            id: "worker-04",
            status: "online",
            jobsInProgress: 3,
            cpuLoad: 84,
            lastSeen: "2025-06-23T14:31:48Z",
        },
        {
            id: "worker-05",
            status: "online",
            jobsInProgress: 1,
            cpuLoad: 47,
            lastSeen: "2025-06-23T14:31:52Z",
        },
        {
            id: "worker-06",
            status: "maintenance",
            jobsInProgress: 0,
            cpuLoad: 0,
            lastSeen: "2025-06-23T14:00:00Z",
        },
    ],
    errorLogs: [
        {
            timestamp: "2025-06-23T14:29:10Z",
            message: "File not found during ingestion",
            code: "ERR_404",
            retriable: false,
            jobId: "job_23124",
        },
        {
            timestamp: "2025-06-23T14:27:45Z",
            message: "Worker timeout on job execution",
            code: "TIMEOUT",
            retriable: true,
            jobId: "job_23120",
        },
        {
            timestamp: "2025-06-23T14:25:02Z",
            message: "Unexpected end of stream",
            code: "EOF_ERROR",
            retriable: true,
            jobId: "job_23095",
        },
    ],
    liveJobFeed: [
        {
            id: "job_23130",
            title: "Render Scene Alpha",
            status: "processing",
            progress: 60,
            submittedAt: "2025-06-23T14:30:05Z",
        },
        {
            id: "job_23129",
            title: "Extract Audio Layer",
            status: "queued",
            progress: 0,
            submittedAt: "2025-06-23T14:29:50Z",
        },
        {
            id: "job_23128",
            title: "Transcode Video HighRes",
            status: "completed",
            progress: 100,
            submittedAt: "2025-06-23T14:28:10Z",
        },
        {
            id: "job_23127",
            title: "Generate Thumbnail",
            status: "failed",
            progress: 0,
            submittedAt: "2025-06-23T14:27:00Z",
        },
    ],
};

const MetricCard = ({ title, value, unit, icon: Icon, color = "text-blue-400", trend = null }) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-gray-400 text-sm font-medium">{title}</p>
                <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-white">{value}</p>
                    {unit && <span className="text-gray-400 text-sm">{unit}</span>}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 mt-1 ${trend > 0 ? "text-green-400" : "text-red-400"}`}>
                        <TrendingUp className="w-3 h-3" />
                        <span className="text-xs">{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>
            <Icon className={`w-8 h-8 ${color}`} />
        </div>
    </div>
);

const ProgressBar = ({ value, max = 100, color = "bg-blue-500" }) => (
    <div className="w-full bg-gray-700 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-300`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
    </div>
);

const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
        online: { color: "bg-green-500", text: "Online", icon: CheckCircle },
        offline: { color: "bg-red-500", text: "Offline", icon: XCircle },
        maintenance: { color: "bg-yellow-500", text: "Maintenance", icon: Settings },
        processing: { color: "bg-blue-500", text: "Processing", icon: Activity },
        queued: { color: "bg-gray-500", text: "Queued", icon: Clock },
        completed: { color: "bg-green-500", text: "Completed", icon: CheckCircle },
        failed: { color: "bg-red-500", text: "Failed", icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.offline;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${config.color}`}>
            <Icon className="w-3 h-3" />
            {config.text}
        </span>
    );
};

const VideoProcessingMonitor = () => {
    const [isPaused, setIsPaused] = useState(false);
    const [watchMode, setWatchMode] = useState(true);
    const [data, setData] = useState(monitoringMockData);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    // Simulate real-time updates
    useEffect(() => {
        if (!watchMode) return;

        const interval = setInterval(() => {
            setData((prevData) => ({
                ...prevData,
                systemStats: {
                    ...prevData.systemStats,
                    cpuUsage: Math.max(20, Math.min(95, prevData.systemStats.cpuUsage + (Math.random() - 0.5) * 10)),
                    memoryUsage: Math.max(30, Math.min(90, prevData.systemStats.memoryUsage + (Math.random() - 0.5) * 5)),
                    queueSize: Math.max(0, prevData.systemStats.queueSize + Math.floor((Math.random() - 0.5) * 3)),
                    lastUpdated: new Date().toISOString(),
                },
            }));
            setLastUpdate(new Date());
        }, 3000);

        return () => clearInterval(interval);
    }, [watchMode]);

    const formatTime = (timestamp: Date) => {
        return new Date(timestamp).toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const errorCounts = data.errorLogs.reduce((acc, error) => {
        acc[error.code] = (acc[error.code] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Video Processing Pipeline</h1>
                        <p className="text-gray-400">Real-time monitoring and system analytics</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <div className={`w-2 h-2 rounded-full ${watchMode ? "bg-green-400 animate-pulse" : "bg-gray-500"}`} />
                            Last update: {formatTime(lastUpdate)}
                        </div>
                        <button
                            onClick={() => setWatchMode(!watchMode)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                watchMode ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"
                            }`}
                        >
                            <Eye className="w-4 h-4" />
                            {watchMode ? "Live" : "Paused"}
                        </button>
                    </div>
                </div>

                {/* System Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard title="CPU Usage" value={data.systemStats.cpuUsage.toFixed(1)} unit="%" icon={Cpu} color="text-blue-400" />
                    <MetricCard title="Memory Usage" value={data.systemStats.memoryUsage.toFixed(1)} unit="%" icon={Monitor} color="text-green-400" />
                    <MetricCard title="Queue Size" value={data.systemStats.queueSize} icon={Database} color="text-yellow-400" />
                    <MetricCard
                        title="Active Workers"
                        value={`${data.systemStats.activeWorkers}/${data.systemStats.totalWorkers}`}
                        icon={Users}
                        color="text-purple-400"
                    />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Jobs Per Minute */}
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-400" />
                            Jobs Per Minute
                        </h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={data.jobTrends.jobsPerMinute}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="timestamp" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#1F2937",
                                        border: "1px solid #374151",
                                        borderRadius: "0.5rem",
                                    }}
                                />
                                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Processing Time */}
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-green-400" />
                            Average Processing Time
                        </h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={data.jobTrends.averageProcessingTime}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="timestamp" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#1F2937",
                                        border: "1px solid #374151",
                                        borderRadius: "0.5rem",
                                    }}
                                />
                                <Line type="monotone" dataKey="seconds" stroke="#10B981" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Worker Status and Live Jobs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Worker Status */}
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Server className="w-5 h-5 text-purple-400" />
                            Worker Status
                        </h3>
                        <div className="space-y-3">
                            {data.workerStatus.map((worker) => (
                                <div key={worker.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={worker.status} />
                                        <span className="font-medium">{worker.id}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <span>Jobs: {worker.jobsInProgress}</span>
                                        {worker.cpuLoad !== null && (
                                            <div className="flex items-center gap-2">
                                                <span>CPU: {worker.cpuLoad}%</span>
                                                <div className="w-16">
                                                    <ProgressBar value={worker.cpuLoad} color="bg-blue-500" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Live Job Feed */}
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-400" />
                            Live Job Feed
                        </h3>
                        <div className="space-y-3">
                            {data.liveJobFeed.map((job) => (
                                <div key={job.id} className="p-3 bg-gray-700 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">{job.title}</span>
                                        <StatusBadge status={job.status} />
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                        <span>{job.id}</span>
                                        <span>•</span>
                                        <span>{formatTime(job.submittedAt)}</span>
                                    </div>
                                    {job.status === "processing" && (
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span>Progress</span>
                                                <span>{job.progress}%</span>
                                            </div>
                                            <ProgressBar value={job.progress} color="bg-blue-500" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Error Analytics and Admin Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Error Analytics */}
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            Recent Errors
                        </h3>
                        <div className="space-y-3">
                            {data.errorLogs.map((error, index) => (
                                <div key={index} className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-red-400">{error.code}</span>
                                        <span className="text-xs text-gray-500">{formatTime(error.timestamp)}</span>
                                    </div>
                                    <p className="text-sm text-gray-300 mb-2">{error.message}</p>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-gray-400">Job: {error.jobId}</span>
                                        {error.retriable && <span className="px-2 py-1 bg-blue-600 rounded text-white">Retriable</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Admin Controls */}
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-gray-400" />
                            Admin Controls
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setIsPaused(!isPaused)}
                                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                                        isPaused ? "bg-green-600 hover:bg-green-700" : "bg-yellow-600 hover:bg-yellow-700"
                                    }`}
                                >
                                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                                    {isPaused ? "Resume" : "Pause"} Intake
                                </button>
                                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
                                    <RefreshCw className="w-4 h-4" />
                                    Retry Failed
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                    Clear Finished
                                </button>
                                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors">
                                    <Bell className="w-4 h-4" />
                                    Alert Config
                                </button>
                            </div>

                            {/* System Resource Bars */}
                            <div className="space-y-3 pt-4 border-t border-gray-700">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Disk Usage</span>
                                        <span>{data.systemStats.diskUsage.toFixed(1)}%</span>
                                    </div>
                                    <ProgressBar
                                        value={data.systemStats.diskUsage}
                                        color={data.systemStats.diskUsage > 80 ? "bg-red-500" : "bg-orange-500"}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Frequency Chart */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        Error Frequency by Type
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={Object.entries(errorCounts).map(([code, count]) => ({ code, count }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="code" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1F2937",
                                    border: "1px solid #374151",
                                    borderRadius: "0.5rem",
                                }}
                            />
                            <Bar dataKey="count" fill="#EF4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default VideoProcessingMonitor;
