import { Card, CardContent } from "@/components/ui/card";
import { XCircle } from "lucide-react";

function DashError() {
    return (
        <div className="min-h-screen bg-black p-6">
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

export default DashError;
