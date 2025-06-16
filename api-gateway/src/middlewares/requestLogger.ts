import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { Logger } from "../utils/logger";
import { LogData, LoggerConfig } from "../types/logger";

// Default configuration
const defaultConfig: LoggerConfig = {
    includeBody: false,
    includeQuery: true,
    includeParams: true,
    excludePaths: ["/health", "/favicon.ico"],
    sensitiveFields: ["password", "token", "authorization", "cookie"],
    maxBodySize: 1024, // 1KB
    colorize: process.env.NODE_ENV !== "production",
};

// Extend Request interface to include timing and requestId
declare global {
    namespace Express {
        interface Request {
            startTime?: number;
            requestId?: string;
        }
    }
}

export const createRequestLogger = (config: Partial<LoggerConfig> = {}) => {
    const finalConfig = { ...defaultConfig, ...config };

    return (req: Request, res: Response, next: NextFunction) => {
        // Skip excluded paths
        if (finalConfig.excludePaths?.some((path) => req.path.startsWith(path))) {
            return next();
        }

        // Add request ID and start time
        req.requestId = uuidv4();
        req.startTime = Date.now();

        // Helper function to sanitize sensitive data
        const sanitizeData = (obj: any): any => {
            if (!obj || typeof obj !== "object") return obj;

            const sanitized = { ...obj };
            finalConfig.sensitiveFields?.forEach((field) => {
                if (sanitized[field]) {
                    sanitized[field] = "[REDACTED]";
                }
            });
            return sanitized;
        };

        // Helper function to truncate large bodies
        const truncateBody = (body: any): any => {
            if (!body) return body;

            const bodyString = JSON.stringify(body);
            if (bodyString.length > (finalConfig.maxBodySize || 1024)) {
                return {
                    _truncated: true,
                    _originalSize: bodyString.length,
                    _preview: bodyString.substring(0, finalConfig.maxBodySize),
                };
            }
            return body;
        };

        // Prepare initial log data
        const logData: Partial<LogData> = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl || req.url,
            userAgent: req.get("User-Agent"),
            ip: req.ip || req.connection.remoteAddress || "unknown",
            userId: req.session?.userId,
            sessionId: req.session?.sessionId || req.sessionID,
            referer: req.get("Referer"),
            requestId: req.requestId,
        };

        // Add optional data based on config
        if (finalConfig.includeQuery && Object.keys(req.query).length > 0) {
            logData.query = sanitizeData(req.query);
        }

        if (finalConfig.includeParams && Object.keys(req.params).length > 0) {
            logData.params = sanitizeData(req.params);
        }

        if (finalConfig.includeBody && req.body && Object.keys(req.body).length > 0) {
            logData.body = truncateBody(sanitizeData(req.body));
        }

        // Log request start (optional - uncomment if you want request start logs)
        // console.log(`→ ${logData.method} ${logData.url} [${logData.requestId}]`);

        // Override res.end to capture response data
        const originalEnd = res.end.bind(res);
        res.end = function (chunk?: any, encoding?: any, callback?: any): any {
            // Calculate response time
            const responseTime = req.startTime ? Date.now() - req.startTime : undefined;

            // Complete log data
            const completeLogData: LogData = {
                ...(logData as LogData),
                statusCode: res.statusCode,
                responseTime,
                contentLength: res.get("Content-Length") ? parseInt(res.get("Content-Length")!) : undefined,
            };

            // Log to file
            Logger.writeLog(completeLogData);

            // Log to console
            const consoleLog = Logger.formatConsoleLog(completeLogData, finalConfig.colorize);
            console.log(consoleLog);

            // Log errors with more details
            if (res.statusCode >= 400) {
                console.error(`ERROR [${req.requestId}]:`, {
                    method: req.method,
                    url: req.originalUrl,
                    statusCode: res.statusCode,
                    userId: req.session?.userId,
                    userAgent: req.get("User-Agent"),
                    ip: logData.ip,
                });
            }

            // Call original end method
            originalEnd.call(this, chunk, encoding);
        };

        next();
    };
};

// Pre-configured middleware for different environments
export const requestLogger = createRequestLogger();

export const detailedRequestLogger = createRequestLogger({
    includeBody: true,
    includeQuery: true,
    includeParams: true,
    maxBodySize: 2048,
});

export const productionRequestLogger = createRequestLogger({
    includeBody: false,
    includeQuery: false,
    includeParams: false,
    colorize: false,
    excludePaths: ["/health", "/favicon.ico", "/metrics"],
});
