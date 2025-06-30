import DashHeader from "./DashHeader";
import DashUploadBtn from "./DashUploadBtn";

function DashLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
            <div className="max-w-7xl mx-auto">
                <DashHeader />
                <DashUploadBtn />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-white/10 backdrop-blur-md border-white/20 rounded-xl animate-pulse border " />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default DashLoading;
