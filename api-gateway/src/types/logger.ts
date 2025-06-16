export interface LogData {
    timestamp: string;
    method: string;
    url: string;
    userAgent?: string;
    ip: string;
    userId?: number;
    sessionId?: string;
    statusCode?: number;
    responseTime?: number;
    contentLength?: number;
    referer?: string;
    requestId: string;
    body?: any;
    query?: any;
    params?: any;
    error?: string;
}

export interface LoggerConfig {
    includeBody?: boolean;
    includeQuery?: boolean;
    includeParams?: boolean;
    excludePaths?: string[];
    sensitiveFields?: string[];
    maxBodySize?: number;
    colorize?: boolean;
}
