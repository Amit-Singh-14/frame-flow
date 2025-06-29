import { UserModel } from "@/models/User";
import { User } from "../types";
import { Request } from "express";

export class UserService {
    async createOrGetBySession(sessionId: string): Promise<User> {
        try {
            // Use your existing findOrCreate method
            return await UserModel.findOrCreate(sessionId);
        } catch (error) {
            console.error("Error in createOrGetBySession:", error);
            throw new Error("Failed to create or retrieve user");
        }
    }

    async getById(id: number): Promise<User | null> {
        try {
            return await UserModel.findById(id);
        } catch (error) {
            console.error("Error in getById:", error);
            throw new Error("Failed to retrieve user");
        }
    }

    async getCurrentUser(req: Request): Promise<User | null> {
        if (!req.session.userId) {
            return null;
        }
        console.log(req.session.userId);

        return this.getById(req.session.userId);
    }

    async getUserStats(userId: number) {
        try {
            // Import JobModel if needed
            const { JobModel } = await import("@/models/Job");
            return await JobModel.getJobStats(userId);
        } catch (error) {
            console.error("Error getting user stats:", error);
            throw new Error("Failed to retrieve user statistics");
        }
    }
}
