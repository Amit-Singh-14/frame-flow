import { AlertCircle, CheckCircle, Clock } from "lucide-react";

type StatusType = "completed" | "failed" | "processing" | "queued" | string;

export const StatusBadge = ({ status }: { status: StatusType }) => {
    const getStatusConfig = () => {
        switch (status) {
            case "completed":
                return {
                    bg: "bg-emerald-500/10",
                    text: "text-emerald-400",
                    border: "border-emerald-500/20",
                    icon: CheckCircle,
                };
            case "failed":
                return {
                    bg: "bg-red-500/10",
                    text: "text-red-400",
                    border: "border-red-500/20",
                    icon: AlertCircle,
                };
            case "processing":
                return {
                    bg: "bg-blue-500/10",
                    text: "text-blue-400",
                    border: "border-blue-500/20",
                    icon: Clock,
                };
            case "queued":
                return {
                    bg: "bg-amber-500/10",
                    text: "text-amber-400",
                    border: "border-amber-500/20",
                    icon: Clock,
                };
            default:
                return {
                    bg: "bg-gray-500/10",
                    text: "text-gray-400",
                    border: "border-gray-500/20",
                    icon: Clock,
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
        >
            <Icon className="w-3 h-3" />
            {status}
        </div>
    );
};
