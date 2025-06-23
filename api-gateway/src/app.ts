import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./utils/config";
import { initialzeDatabase } from "./database/schema";
import { sessionMiddleware } from "./middlewares/session";
import { detailedRequestLogger } from "./middlewares/requestLogger";
import userRoutes from "@/routes/user";
import uploadRoutes from "@/routes/upload";
import jobsRoutes from "@/routes/job";

const app = express();

app.use(detailedRequestLogger);

// Security middleware
app.use(helmet());
app.use(
    cors({
        origin: config.nodeEnv === "production" ? false : true,
        credentials: true,
    })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Initialize database
initialzeDatabase().catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
});

// Session configuration
app.use(sessionMiddleware);

// app.use((req, res, next) => {
//     console.log("Incoming Cookies:", req.headers.cookie);
//     console.log("Session ID:", req.sessionID);
//     console.log("Session:", req.session);
//     next();
// });

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// API routes
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/jobs", jobsRoutes);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.log(err);
    console.error(`ERROR [${req.requestId}]:`, err.stack);

    // Log error details
    const errorLog = {
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        userId: req.session?.userId,
        ip: req.ip,
    };

    console.error("Detailed Error:", errorLog);

    res.status(500).json({
        error: "Something went wrong!",
        requestId: req.requestId,
    });
});
// FIXME:   throw new TypeError(`Missing parameter name at ${i}: ${DEBUG_URL}`);

// app.all("*", (req, res) => {
//     res.status(404).json({
//         error: "Route not found",
//         path: req.originalUrl,
//         method: req.method,
//     });
// });

// 404 handler - must be last

const PORT = config.port;

app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
    console.log(`📝 Environment: ${config.nodeEnv}`);
    console.log(`💾 Database: ${config.database.path}`);
    console.log(`📁 Upload directory: ${config.storage.uploadDir}`);
    console.log(`📤 Output directory: ${config.storage.outputDir}`);
});

export default app;
