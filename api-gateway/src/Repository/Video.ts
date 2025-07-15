import { db } from "@/database/connection";
import { Database } from "@/database/connection";

export interface Video {
    id: number;
    user_id: number;
    title: string;
    file_name: string;
    input_file: string;
    file_size: number;
    format: string;
    duration: number | undefined;
    resolution: string | undefined;
    thumbnail_url: string | undefined;
    preview_url: string | undefined;
    uploaded_at: string;
    is_active: boolean;
}

export interface CreateVideoData {
    user_id: number;
    title: string;
    file_name: string;
    input_file: string;
    file_size: number;
    format: string;
    duration?: number | undefined;
    resolution?: string | undefined;
    thumbnail_url?: string | undefined;
    preview_url?: string | undefined;
    uploaded_at?: string;
    is_active?: boolean;
}

export interface UpdateVideoData {
    title?: string;
    thumbnail_url?: string;
    preview_url?: string;
    is_active?: boolean;
}

const connection = db.getDb();

export class VideoRepository {
    static async create(data: CreateVideoData): Promise<Video> {
        const query = `
            INSERT INTO videos (
                user_id, title, file_name, input_file, file_size, format,
                duration, resolution, thumbnail_url, preview_url, uploaded_at, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            data.user_id,
            data.title,
            data.file_name,
            data.input_file,
            data.file_size,
            data.format,
            data.duration || null,
            data.resolution || null,
            data.thumbnail_url || null,
            data.preview_url || null,
            data.uploaded_at || new Date().toISOString(),
            data.is_active !== undefined ? data.is_active : 1,
        ];

        const result = await db.run(query, values);
        return await db.get("SELECT * FROM videos WHERE id = ?", [result.lastID]);
    }

    static findById(id: number): Promise<Video | null> {
        return db.get("SELECT * FROM videos WHERE id = ?", [id]);
    }

    static findByIdAndUser(id: number, userId: number): Promise<Video | null> {
        return db.get("SELECT * FROM videos WHERE id = ? AND user_id = ?", [id, userId]);
    }

    static findAllByUser(
        userId: number,
        options?: {
            limit?: number;
            offset?: number;
            isActive?: boolean;
            orderBy?: string;
            orderDir?: string;
        }
    ): Promise<Video[]> {
        let query = "SELECT * FROM videos WHERE user_id = ?";
        const params: any[] = [userId];

        if (options?.isActive !== undefined) {
            query += " AND is_active = ?";
            params.push(options.isActive ? 1 : 0);
        }

        const orderBy = options?.orderBy || "uploaded_at";
        const orderDir = options?.orderDir === "ASC" ? "ASC" : "DESC";
        query += ` ORDER BY ${orderBy} ${orderDir}`;

        if (options?.limit !== undefined) {
            query += " LIMIT ?";
            params.push(options.limit);
            if (options.offset !== undefined) {
                query += " OFFSET ?";
                params.push(options.offset);
            }
        }

        return db.all(query, params);
    }

    static async update(id: number, data: UpdateVideoData): Promise<Video | null> {
        const fields: string[] = [];
        const values: any[] = [];

        if (data.title !== undefined) {
            fields.push("title = ?");
            values.push(data.title);
        }
        if (data.thumbnail_url !== undefined) {
            fields.push("thumbnail_url = ?");
            values.push(data.thumbnail_url);
        }
        if (data.preview_url !== undefined) {
            fields.push("preview_url = ?");
            values.push(data.preview_url);
        }
        if (data.is_active !== undefined) {
            fields.push("is_active = ?");
            values.push(data.is_active ? 1 : 0);
        }

        if (fields.length === 0) throw new Error("No fields provided for update");

        values.push(id);
        const query = `UPDATE videos SET ${fields.join(", ")} WHERE id = ?`;

        const result = await db.run(query, values);
        if (result.changes === 0) return null;

        return await db.get("SELECT * FROM videos WHERE id = ?", [id]);
    }

    static async softDelete(id: number): Promise<boolean> {
        const result = await db.run("UPDATE videos SET is_active = 0 WHERE id = ?", [id]);
        return result.changes > 0;
    }

    static async hardDelete(id: number): Promise<boolean> {
        const result = await db.run("DELETE FROM videos WHERE id = ?", [id]);
        return result.changes > 0;
    }

    static async countByUser(userId: number, isActive?: boolean): Promise<number> {
        let query = "SELECT COUNT(*) as count FROM videos WHERE user_id = ?";
        const params: any[] = [userId];

        if (isActive !== undefined) {
            query += " AND is_active = ?";
            params.push(isActive ? 1 : 0);
        }

        const row = await db.get(query, params);
        return row?.count || 0;
    }

    static findByFormat(format: string, userId?: number): Promise<Video[]> {
        let query = "SELECT * FROM videos WHERE format = ?";
        const params: any[] = [format];

        if (userId) {
            query += " AND user_id = ?";
            params.push(userId);
        }

        query += " ORDER BY uploaded_at DESC";
        return db.all(query, params);
    }

    static searchByTitle(searchTerm: string, userId?: number): Promise<Video[]> {
        let query = "SELECT * FROM videos WHERE title LIKE ?";
        const params: any[] = [`%${searchTerm}%`];

        if (userId) {
            query += " AND user_id = ?";
            params.push(userId);
        }

        query += " ORDER BY uploaded_at DESC";
        return db.all(query, params);
    }

    static async getStorageStats(userId: number): Promise<{
        totalVideos: number;
        totalSize: number;
        avgFileSize: number;
        formats: { [key: string]: number };
    }> {
        const query = `
            SELECT 
                COUNT(*) as total_videos,
                SUM(file_size) as total_size,
                AVG(file_size) as avg_file_size,
                format,
                COUNT(format) as format_count
            FROM videos 
            WHERE user_id = ? AND is_active = 1
            GROUP BY format
        `;

        const rows = await db.all(query, [userId]);

        const formats: { [key: string]: number } = {};
        let totalVideos = 0;
        let totalSize = 0;

        rows.forEach((row: any) => {
            formats[row.format] = row.format_count;
            totalVideos += row.format_count;
            totalSize += row.total_size || 0;
        });

        return {
            totalVideos,
            totalSize,
            avgFileSize: totalVideos > 0 ? totalSize / totalVideos : 0,
            formats,
        };
    }
}
