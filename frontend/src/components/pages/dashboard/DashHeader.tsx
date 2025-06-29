import { useSession } from "@/context/SessionContext";

function DashHeader() {
    const { sessionId } = useSession();

    return (
        <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">Video Processing Dashboard</h1>
            <p className="text-blue-200 text-lg">
                Session: <span className="text-cyan-300 font-mono">{sessionId}</span>
            </p>
        </div>
    );
}

export default DashHeader;
