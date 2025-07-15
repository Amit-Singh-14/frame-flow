import fs from "fs/promises";
import { FileUtils } from "@/utils/file";
import { config } from "@/utils/config";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

export class UploadSerice {
    private uploadDir: string;
    private tempDir: string;
    private inputDir: string;

    constructor() {
        this.uploadDir = config.storage.uploadDir;
        this.tempDir = path.join(this.uploadDir, "temp");
        this.inputDir = path.join(this.uploadDir, "input");
    }

    /**
     * Validate uploaded file - check if it's a valid video file
     */
    async validateUploadedFile(filePath: string): Promise<boolean> {
        try {
            await FileUtils.fileExists(filePath);

            const stats = await FileUtils.getFileSize(filePath);
            if (stats === 0) {
                console.error("File is empty");
                return false;
            }

            // Check if file size exceeds maximum allowed
            if (stats > config.files.maxFileSize) {
                console.error(`File size exceeds maximum allowed: ${stats} > ${config.files.maxFileSize}`);
                return false;
            }

            // Validate video file using ffmpeg
            return await this.validateVideoFile(filePath);
        } catch (error) {
            console.error("Error validating file:", error);
            return false;
        }
    }

    /**
     * Validate video file using ffmpeg probe
     */
    private async validateVideoFile(filePath: string): Promise<boolean> {
        return new Promise((resolve) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) {
                    console.error("FFprobe error:", err);
                    resolve(false);
                    return;
                }

                // Check if file has video streams
                const hasVideoStream = metadata.streams?.some((stream) => stream.codec_type === "video");

                if (!hasVideoStream) {
                    console.error("No video stream found in file");
                    resolve(false);
                    return;
                }

                // Additional validation checks
                const videoStream = metadata.streams.find((stream) => stream.codec_type === "video");

                if (!videoStream) {
                    resolve(false);
                    return;
                }

                // Check for reasonable duration (not too short, not suspiciously long)
                const duration = parseFloat(videoStream.duration || metadata.format?.duration?.toString() || "0");

                if (duration < 0.1 || duration > 36000) {
                    // 0.1 seconds to 10 hours
                    console.error(`Invalid video duration: ${duration} seconds`);
                    resolve(false);
                    return;
                }

                resolve(true);
            });
        });
    }

    async cancelUpload(filePath: string): Promise<void> {
        try {
            await FileUtils.deleteFile(filePath);
            console.log(`Cleaned up file: ${filePath}`);
        } catch (error) {
            console.warn(`Could not clean up file ${filePath}:`, error);
        }
    }

    /**
     * Move uploaded file to permanent location
     */
    async moveToInput(tempPath: string, filename: string): Promise<string> {
        const inputPath = path.join(this.inputDir, filename);

        try {
            await FileUtils.ensureDirectoryExists(this.inputDir);
            await fs.rename(tempPath, inputPath);
            return inputPath;
        } catch (error) {
            console.error("Error moving file to input directory:", error);
            throw new Error("Failed to move uploaded file to input directory");
        }
    }

    /**
     * Get upload statistics
     */
    async getUploadStats(): Promise<{
        totalFiles: number;
        totalSize: number;
        inputDirSize: number;
        tempDirSize: number;
    }> {
        try {
            const [inputFiles, tempFiles] = await Promise.all([fs.readdir(this.inputDir), fs.readdir(this.tempDir)]);

            let inputDirSize = 0;
            let tempDirSize = 0;

            // Calculate input directory size
            for (const file of inputFiles) {
                const stats = await fs.stat(path.join(this.inputDir, file));
                inputDirSize += stats.size;
            }

            // Calculate temp directory size
            for (const file of tempFiles) {
                const stats = await fs.stat(path.join(this.tempDir, file));
                tempDirSize += stats.size;
            }

            return {
                totalFiles: inputFiles.length + tempFiles.length,
                totalSize: inputDirSize + tempDirSize,
                inputDirSize,
                tempDirSize,
            };
        } catch (error) {
            console.error("Error getting upload statistics:", error);
            return {
                totalFiles: 0,
                totalSize: 0,
                inputDirSize: 0,
                tempDirSize: 0,
            };
        }
    }
}
