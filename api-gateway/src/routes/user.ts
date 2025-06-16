import { Router, Request, Response } from "express";
import { UserService } from "../services/userService";
import { ensureUser } from "@/middlewares/session";

const router = Router();
const userService = new UserService();

// POST /api/users/session - Create/get session user
router.post("/session", ensureUser, async (req: Request, res: Response) => {
    try {
        const user = await userService.getCurrentUser(req);

        if (!user) {
            res.status(500).json({
                error: "Failed to create or retrieve user session",
            });
            return;
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                sessionId: user.session_id,
                createdAt: user.created_at,
            },
        });
    } catch (error) {
        console.error("Error in POST /session:", error);
        res.status(500).json({
            error: "Internal server error",
        });
    }
});

// GET /api/users/me - Get current user info
router.get("/me", ensureUser, async (req: Request, res: Response) => {
    try {
        const user = await userService.getCurrentUser(req);

        if (!user) {
            res.status(404).json({
                error: "User not found",
            });
            return;
        }

        // Optionally include user stats
        const stats = await userService.getUserStats(user.id);

        res.json({
            user: {
                id: user.id,
                sessionId: user.session_id,
                createdAt: user.created_at,
                stats,
            },
        });
    } catch (error) {
        console.error("Error in GET /me:", error);
        res.status(500).json({
            error: "Internal server error",
        });
    }
});

export default router;
