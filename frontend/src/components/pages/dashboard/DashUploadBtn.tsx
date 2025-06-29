import { Button } from "@/components/ui/button";
import { ROUTES } from "@/utils/constants";
import { Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

function DashUploadBtn() {
    const navigate = useNavigate();
    return (
        <div className="flex justify-center">
            <Button
                onClick={() => navigate(ROUTES.UPLOAD)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-md hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-300 flex items-center"
            >
                <Upload className="w-6 h-6 mr-2" />
                Upload New Video
            </Button>
        </div>
    );
}

export default DashUploadBtn;
