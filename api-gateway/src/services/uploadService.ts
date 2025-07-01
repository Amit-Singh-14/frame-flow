import { JobModel } from "@/models/Job";
import { JobStatus } from "@/types";
import { UploadFile } from "@/types/upload";
import { FileUtils } from "@/utils/file";
import { EnhancedJobService } from "./jobService";

export class UploadSerice {
    async processUploadFile(file: Express.Multer.File, userId: number): Promise<{ file: UploadFile; jobId: number }> {
        try {
            const uploadFile: UploadFile = {
                originalName: file.originalname,
                filename: file.fieldname,
                mimetype: file.mimetype,
                size: file.size,
                path: file.path,
                formattedSize: FileUtils.formatFileSize(file.size),
            };

            const job = await EnhancedJobService.createJob({
                user_id: userId,
                input_file: file.path,
                file_size: file.size,
                conversion_settings: JSON.stringify({
                    quality: "medium",
                    format: "mp4",
                }),
            });

            return {
                file: uploadFile,
                jobId: job.id,
            };
        } catch (error) {
            // if job createion fails, clean up the uploaded file
            // await FileUtils.deleteFile(file.path);
            console.error(error);
            throw error;
        }
    }

    async validateUploadedFile(filePath: string): Promise<boolean> {
        try {
            // check if file exists and is readable
            const fileSize = await FileUtils.getFileSize(filePath);
            return fileSize > 0;
        } catch (error) {
            console.error("File validation failed: ", error);
            throw error;
        }
    }

    async cancelUpload(filePath: string, jobId?: number): Promise<void> {
        try {
            await FileUtils.deleteFile(filePath);

            // if job was created, update it status
            if (jobId) {
                await JobModel.updateStatus(jobId, JobStatus.FAILED, undefined, "Uplaod cancelled");
            }
        } catch (error) {
            console.error("Error canceling upload:", error);
        }
    }
}
