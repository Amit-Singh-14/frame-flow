import { db } from "@/database/connection";
import { User } from "@/types";

export class UserModel {
    static async findBySessionId(sessionId: string): Promise<User | null> {
        try {
            const user = await db.get("SELECT * FROM users WHERE session_id = ?", [sessionId]);

            return user || null;
        } catch (error) {
            console.error("Error finding user by session Id:", sessionId);
            throw error;
        }
    }

    static async create(sessionId: string): Promise<User> {
        try {
            const result = await db.run("INSERT INTO users (session_id) VALUES (?)", [sessionId]);

            const user = await db.get("SELECT * FROM users WHERE id = ?", [result.lastID]);

            return user;
        } catch (error) {
            console.error("Error crreating user: ", error);
            throw error;
        }
    }

    static async findById(id: number): Promise<User | null> {
        try {
            const user = await db.get("SELECT * FROM users WHERE id = ?", [id]);
            return user || null;
        } catch (error) {
            console.error("Error finding user by ID:", error);
            throw error;
        }
    }

    static async findOrCreate(sessionId: string): Promise<User> {
        try {
            let user = await this.findBySessionId(sessionId);

            if (!user) {
                user = await this.create(sessionId);
            }

            return user;
        } catch (error) {
            console.error("Error in findOrCreate:", error);
            throw error;
        }
    }
}
