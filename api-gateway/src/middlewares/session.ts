import session from "express-session";
import { Request, Response, NextFunction } from "express";
import { UserModel } from "@/models/User";
import { createClient } from "redis";
import { RedisStore } from "connect-redis";

const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: Number(process.env.REDIS_PORT) || 6379,
    },
});

redisClient
    .connect()
    .then(() => console.log("connected to redis"))
    .catch(console.error);

// Session middleware configuration
export const sessionMiddleware = session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    name: "video-processor-session",
});

// Middleware to ensure user exists in session
export const ensureUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // If user already exists in session, continue
        console.log("userId", req.headers.cookie);
        if (req.session.userId) {
            return next();
        }
        // If no user in session, create one using your existing UserModel
        const sessionId = req.sessionID;

        // Use your existing findOrCreate method
        const user = await UserModel.findOrCreate(sessionId);

        // Store user info in session
        req.session.userId = user.id;
        req.session.sessionId = user.session_id;
        console.log(req.originalUrl);
        console.log(req.session);
        next();
    } catch (error) {
        console.error("Error in ensureUser middleware:", error);
        res.status(500).json({ error: "Failed to create user session" });
    }
};

// Optional: Middleware to get current user (doesn't create if not exists)
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.session.userId) {
            const user = await UserModel.findById(req.session.userId);
            (req as any).user = user; // Attach user to request object
        }
        next();
    } catch (error) {
        console.error("Error getting current user:", error);
        next(); // Continue even if error (user will be undefined)
    }
};
