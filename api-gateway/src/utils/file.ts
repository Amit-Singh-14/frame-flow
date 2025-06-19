import fs from "fs/promises";
import path from "path";

export class FileUtils {
    static async ensureDirectoryExists(dirPath: string): Promise<void> {
        try {
            await fs.access(dirPath);
        } catch (error) {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }

    static async deleteFile(filePath: string): Promise<boolean> {
        try {
            await fs.unlink(filePath);
            return true;
        } catch (error) {
            console.error("Error deleting file:", filePath, error);
            return false;
        }
    }

    static async getFileSize(filePath: string): Promise<number> {
        try {
            const stats = await fs.stat(filePath);
            return stats.size;
        } catch (error) {
            console.error("error getting file size", filePath, error);
            return 0;
        }
    }

    static generateUniqueFileName(originalName: string): string {
        const timeStamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);

        return `${baseName}_${timeStamp}_${randomString}${extension}`;
    }

    static async cleanUpOldFiles(directory: string, maxAgeHours: number = 24): Promise<void> {
        try {
            const files = await fs.readdir(directory);
            const now = Date.now();

            const maxAge = maxAgeHours * 60 * 60 * 1000;

            for (const file of files) {
                const filePath = path.join(directory, file);
                const stats = await fs.stat(filePath);

                if (now - stats.mtime.getTime() > maxAge) {
                    await this.deleteFile(filePath);
                    console.log("Cleaned Up old file:", file);
                }
            }
        } catch (error) {
            console.error("Error during file cleanUp:", error);
        }
    }

    static formatFileSize(bytes: number): string {
        const size = ["B", "KB", "MB", "GB"];
        if (bytes == 0) return "0 B";

        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${size[i]}`;
    }

    static async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}
