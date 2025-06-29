// components/StatCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

interface StatCardProps {
    icon: ReactNode;
    title: string;
    value: ReactNode;
    subtext: ReactNode;
    gradient: string; // tailwind gradient background
}

export const StatCard = ({ icon, title, value, subtext, gradient }: StatCardProps) => (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 overflow-hidden group relative">
        <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-white/80 text-sm font-medium flex items-center">
                {icon}
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-white mb-2">{value}</div>
            <div className="text-sm">{subtext}</div>
        </CardContent>
    </Card>
);
