export interface User {
    id: number;
    session_id: string;
    created_at: string;
}

export interface SessionData {
    userId?: number;
    sessionId?: string;
}

declare module "express-session" {
    interface SessionData {
        userId?: number;
        sessionId?: string;
    }
}
