export const ActionButton = ({ icon, label, className }: { icon: React.ReactNode; label: string; className: string }) => (
    <button className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${className}`}>
        {icon}
        {label}
    </button>
);
