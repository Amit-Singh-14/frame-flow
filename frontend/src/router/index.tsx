import Layout from "@/components/layouts";
import Dashboard from "@/components/pages/Dashboard";
import UploadPage from "@/components/pages/Upload";
import { createBrowserRouter, Navigate } from "react-router-dom";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            {
                index: true,
                element: <Navigate to={"/dashboard"} replace />,
            },
            {
                path: "dashboard",
                element: <Dashboard />,
            },
            {
                path: "upload",
                element: <UploadPage />,
            },
            {
                path: "jobs",
                // element: <Jobs />,
            },
            {
                path: "jobs/:jobId",
                // element: <JobDetail />,
            },
            {
                path: "monitoring",
                // element: <Monitoring />,
            },
        ],
    },
    {
        path: "*",
        element: <Navigate to="/dashboard" replace />,
    },
]);
