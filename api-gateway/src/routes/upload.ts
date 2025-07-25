import { ensureUser } from "@/middlewares/session";
import { uploadWithMetadata } from "@/middlewares/upload";
import { jobService } from "@/services/jobService";
import { UploadSerice } from "@/services/uploadService";
import { videoService } from "@/services/VideoService";
import { UploadResponse } from "@/types/upload";
import { VideoMetadataExtractor } from "@/utils/videoMetaExtractor";
import { Router, Request, Response } from "express";

const router = Router();
const uploadService = new UploadSerice();

// POST /api/upload - Single file upload endpoint with enhanced job creation
router.post("/", ensureUser, uploadWithMetadata(), async (req: Request, res: Response) => {
    try {
        // Check if file was uploaded
        if (!req.file || !req.fileMetadata) {
            res.status(400).json({
                success: false,
                error: "No file uploaded. Please select a video file.",
                code: "NO_FILE",
            } as UploadResponse);
            return;
        }

        // console.log("Uploaded file:", req.file);
        // console.log("File metadata:", req.fileMetadata);

        // Validate the uploaded file
        const isValid = await uploadService.validateUploadedFile(req.file.path);

        if (!isValid) {
            await uploadService.cancelUpload(req.file.path);
            res.status(400).json({
                success: false,
                error: "Uploaded file is invalid or corrupted.",
                code: "INVALID_FILE",
            } as UploadResponse);
            return;
        }

        let videoMetadata;
        try {
            videoMetadata = await VideoMetadataExtractor.extractMetadata(req.file.path);
        } catch (metadataError) {
            console.warn("Could not extract video metadata:", metadataError);
            // Continue with default values if metadata extraction fails
            videoMetadata = {
                duration: undefined,
                resolution: undefined,
                format: req.fileMetadata.format,
            };
        }
        // console.log("videometa data: ", videoMetadata);
        const userId = req.session.userId;
        if (!userId) {
            await uploadService.cancelUpload(req.file.path);
            res.status(401).json({
                success: false,
                error: "User session not found. Please refresh and try again.",
                code: "NO_USER_SESSION",
            } as UploadResponse);
            return;
        }

        // Create video record in database
        const videoData = {
            user_id: userId,
            title: req.body.title || req.fileMetadata.originalName, // Allow custom title
            file_name: req.fileMetadata.fileName,
            input_file: req.fileMetadata.inputFile,
            file_size: req.fileMetadata.size,
            format: videoMetadata.format || req.fileMetadata.format,
            duration: videoMetadata.duration,
            resolution: videoMetadata.resolution,
            uploaded_at: new Date().toISOString(),
            is_active: true,
        };

        const video = await videoService.createVideo(videoData);

        // Create initial job for the uploaded video
        const jobType = req.body.jobType || "transcode"; // Default to transcode
        const conversion_settings = req.body.conversionSettings || "{}";

        const jobData = {
            user_id: userId,
            video_id: video.id,
            title: `${jobType} - ${video.title}`,
            status: "pending" as const,
            health_status: "waiting" as const,
            status_description: "Job created and waiting to be queued",
            job_type: jobType,
            conversion_settings,
            tags: req.body.tags, // Can be comma-separated string or JSON array
            created_at: new Date().toISOString(),
            duration: videoMetadata.duration,
            file_name: video.file_name,
            file_size: video.file_size,
            resolution: video.resolution,
            retry_count: 0,
            priority: parseInt(req.body.priority) || 0,
        };

        const job = await jobService.create(jobData);

        // Queue the job for processing (if you have a job queue system)
        try {
            await jobService.queueJob(job.id);
        } catch (queueError) {
            console.warn("Could not queue job immediately:", queueError);
            // TODO: when adding to queue fail after the service is up make sure to automatically add it to queue
            // Job is still created in database, can be picked up by workers later
        }

        // Success response
        const response = {
            success: true,
            message: "File uploaded and job created successfully",
            data: {
                video: {
                    id: video.id,
                    title: video.title,
                    fileName: video.file_name,
                    fileSize: video.file_size,
                    format: video.format,
                    duration: video.duration,
                    resolution: video.resolution,
                    uploadedAt: video.uploaded_at,
                },
                job: {
                    id: job.id,
                    title: job.title,
                    status: job.status,
                    jobType: job.job_type,
                    priority: job.priority,
                    createdAt: job.created_at,
                },
            },
        };

        res.status(201).json(response);
    } catch (error) {
        console.error("Upload processing error:", error);

        // Enhanced error handling with cleanup
        let cleanupErrors: string[] = [];

        // Clean up file if it exists
        if (req.file) {
            try {
                await uploadService.cancelUpload(req.file.path);
            } catch (cleanupError) {
                console.error("Error during file cleanup:", cleanupError);
                cleanupErrors.push("File cleanup failed");
            }
        }

        // Determine specific error type and response
        let errorResponse: UploadResponse;

        if (error instanceof Error) {
            // Handle specific job creation errors
            if (error.message.includes("database")) {
                errorResponse = {
                    success: false,
                    error: "Database error during job creation. Please try again.",
                    code: "DATABASE_ERROR",
                    details: cleanupErrors.length > 0 ? { cleanupErrors } : undefined,
                };
            } else if (error.message.includes("validation")) {
                errorResponse = {
                    success: false,
                    error: "Job validation failed. Please check your file and settings.",
                    code: "VALIDATION_ERROR",
                    details: cleanupErrors.length > 0 ? { cleanupErrors } : undefined,
                };
            } else if (error.message.includes("queue")) {
                errorResponse = {
                    success: false,
                    error: "Job queue is currently unavailable. Please try again later.",
                    code: "QUEUE_ERROR",
                    details: cleanupErrors.length > 0 ? { cleanupErrors } : undefined,
                };
            } else {
                errorResponse = {
                    success: false,
                    error: "Failed to process uploaded file and create job. Please try again.",
                    code: "PROCESSING_ERROR",
                    details: {
                        message: error.message,
                        cleanupErrors: cleanupErrors.length > 0 ? cleanupErrors : undefined,
                    },
                };
            }
        } else {
            errorResponse = {
                success: false,
                error: "An unexpected error occurred during upload processing.",
                code: "UNKNOWN_ERROR",
                details: cleanupErrors.length > 0 ? { cleanupErrors } : undefined,
            };
        }

        res.status(500).json(errorResponse);
    }
});

export default router;
