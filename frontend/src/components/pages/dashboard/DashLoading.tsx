function DashLoading() {
    return (
        <div className="min-h-screen bg-black p-6">
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

export default DashLoading;
