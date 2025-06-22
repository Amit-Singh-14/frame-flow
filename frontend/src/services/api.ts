import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const sessionId = localStorage.getItem("sessionId");
        if (sessionId) {
            config.headers["X-Session-ID"] = sessionId;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle common HTTP errors
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem("sessionId");
            window.location.href = "/";
        } else if (error.response?.status === 429) {
            // Handle rate limiting
            console.warn("Rate limit exceeded");
        } else if (error.response?.status >= 500) {
            // Handle server errors
            console.error("Server error:", error.response.data);
        }

        return Promise.reject(error);
    }
);

export const API_ENDPOINTS = {
    // User endpoints
    createSession: "/users/session",
    getCurrentUser: "/users/me",

    // upload endpoints
    upload: "/upload",

    // Job endpoints
    jobs: "/jobs",
    jobDetail: (jobId: string) => `/jobs/${jobId}`,

    // monitoring endpoints
    // TODO: add rest job endpoint and monitoring enedpoints
};

export default api;
