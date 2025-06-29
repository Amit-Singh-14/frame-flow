// Helper components
export const InfoSection = ({ title, icon, items }: { title: string; icon: React.ReactNode; items: [string, React.ReactNode][] }) => (
    <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-800/30">
        <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            {icon}
            {title}
        </h4>
        <div className="space-y-2 text-sm">
            {items.map(([label, value], idx) => (
                <div key={idx} className="flex justify-between">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-white">{value}</span>
                </div>
            ))}
        </div>
    </div>
);
