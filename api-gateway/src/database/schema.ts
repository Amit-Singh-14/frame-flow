import { ERROR } from "sqlite3";
import { db } from "./connection";

export const initialzeDatabase = async (): Promise<void> => {
    try {
        // Create users table
        await db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT UNIQUE NOT NULL,
                crated_id DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create jobs table
        await db.run(`
            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
                input_file TEXT NOT NULL,
                output_file TEXT,
                error_message TEXT,
                conversion_settings TEXT, -- JSON string for conversion parameters
                file_size INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        `);

        // Create indexes for better performance
        await db.run(`
            CREATE INDEX IF NOT EXISTS idx_users_session_id ON users(session_id)
        `);

        await db.run(`
            CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id)
        `);

        await db.run(`
            CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)
        `);

        console.log("✅ Database tables initialized successfully");
    } catch (err) {
        console.error("❌ Error initializing database:", err);
        throw err;
    }
};
