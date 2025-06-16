import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import { config } from "./utils/config";

const app = express();

// Security middleware
app.use(helmet());
app.use(
    cors({
        origin: config.nodeEnv === "production" ? false : true,
        credentials: true,
    })
);

// Session configuration
app.use(
    session({
        secret: config.session.secret,
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: config.nodeEnv === "production",
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        },
    })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// API routes
app.get("/api", (req, res) => {
    res.json({ message: "API Gateway is running!" });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Error:", err);

    res.status(err.status || 500).json({
        error: config.nodeEnv === "production" ? "Internal Server Error" : err.message,
        ...(config.nodeEnv !== "production" && { stack: err.stack }),
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
