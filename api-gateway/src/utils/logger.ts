import { LogData } from "@/types/logger";
import fs from "fs";
import path from "path";

export class Logger {
    private static logDir = process.env.LOG_DIR || "logs";
    private static maxFileSize = 10 * 1024 * 1024; // 10MB
    private static maxFiles = 5;

    static {
        // Ensure log directory exists
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    private static getLogFileName(): string {
        const date = new Date().toISOString().split("T")[0];
        return path.join(this.logDir, `access-${date}.log`);
    }

    private static shouldRotateLog(): boolean {
        const logFile = this.getLogFileName();
        if (!fs.existsSync(logFile)) return false;

        const stats = fs.statSync(logFile);
        return stats.size > this.maxFileSize;
    }

    private static rotateLog(): void {
        const logFile = this.getLogFileName();
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const rotatedFile = logFile.replace(".log", `-${timestamp}.log`);

        try {
            fs.renameSync(logFile, rotatedFile);
            this.cleanOldLogs();
        } catch (error) {
            console.error("Error rotating log file:", error);
        }
    }

    private static cleanOldLogs(): void {
        try {
            const files = fs
                .readdirSync(this.logDir)
                .filter((file) => file.startsWith("access-") && file.endsWith(".log"))
                .map((file) => ({
                    name: file,
                    path: path.join(this.logDir, file),
                    time: fs.statSync(path.join(this.logDir, file)).mtime,
                }))
                .sort((a, b) => b.time.getTime() - a.time.getTime());

            // Keep only the most recent files
            files.slice(this.maxFiles).forEach((file) => {
                fs.unlinkSync(file.path);
            });
        } catch (error) {
            console.error("Error cleaning old logs:", error);
        }
    }

    static writeLog(logData: LogData): void {
        try {
            if (this.shouldRotateLog()) {
                this.rotateLog();
            }

            const logFile = this.getLogFileName();
            const logLine = JSON.stringify(logData) + "\n";

            fs.appendFileSync(logFile, logLine);
        } catch (error) {
            console.error("Error writing to log file:", error);
        }
    }

    static formatConsoleLog(logData: LogData, colorize: boolean = true): string {
        const { timestamp, method, url, statusCode, responseTime, userId, ip } = logData;

        let statusColor = "";
        let resetColor = "";

        if (colorize && statusCode) {
            if (statusCode >= 500) statusColor = "\x1b[31m"; // Red
            else if (statusCode >= 400) statusColor = "\x1b[33m"; // Yellow
            else if (statusCode >= 300) statusColor = "\x1b[36m"; // Cyan
            else if (statusCode >= 200) statusColor = "\x1b[32m"; // Green
            resetColor = "\x1b[0m";
        }

        const userInfo = userId ? ` [User: ${userId}]` : "";
        const timeInfo = responseTime ? ` (${responseTime}ms)` : "";

        return `${timestamp} - ${ip} - ${method} ${url}${statusColor} ${statusCode}${resetColor}${timeInfo}${userInfo}`;
    }
}
