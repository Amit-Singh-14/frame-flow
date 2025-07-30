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

        // Create videos table
        await db.run(`
            CREATE TABLE IF NOT EXISTS videos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT,
                file_name TEXT NOT NULL,
                input_file TEXT NOT NULL, -- Absolute or relative URI to the uploaded file
                file_size INTEGER,
                format TEXT,
                duration INTEGER, -- In seconds
                resolution TEXT,
                thumbnail_url TEXT,
                preview_url TEXT,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        // Create jobs table
        await db.run(`
            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                video_id INTEGER NOT NULL,
                title TEXT,
                
                status TEXT NOT NULL CHECK(status IN (
                    'pending', 'queued', 'processing', 'completed', 'failed', 'cancelled'
                )),
                
                health_status TEXT CHECK(health_status IN (
                    'healthy', 'unhealthy', 'in-progress', 'waiting'
                )),
                
                status_description TEXT,
                job_type TEXT CHECK(job_type IN (
                    'transcode', 'compress', 'resize', 'change-framerate', 'convert-container'
                )),

                tags TEXT, -- e.g., "promo,hd,client-a" OR '["promo", "hd", "client-a"]' (JSON)
                conversion_settings TEXT NOT NULL,
                
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                started_at DATETIME,
                completed_at DATETIME,
                updated_at DATETIME,

                progress_percentage INTEGER DEFAULT 0,
                current_step TEXT,
                step_details TEXT,

                duration INTEGER, -- in seconds
                file_name TEXT,
                file_size INTEGER,
                resolution TEXT,

                output_file TEXT,
                preview_url TEXT,
                thumbnail_url TEXT,

                retry_count INTEGER DEFAULT 0,
                priority INTEGER DEFAULT 0,
                worker_id TEXT,

                error_message TEXT,
                error_code TEXT,
                error_retriable BOOLEAN,

                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
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
