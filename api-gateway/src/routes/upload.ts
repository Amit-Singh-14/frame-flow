import { ensureUser } from "@/middlewares/session";
import { handleUploadError, uploadMiddleware } from "@/middlewares/upload";
import { UploadSerice } from "@/services/uploadService";
import { EnhancedJobService } from "@/services/jobService";
import { JobHelper } from "@/utils/jobHelper";
import { UploadResponse } from "@/types/upload";
import { Router, Request, Response } from "express";

const router = Router();
const uploadService = new UploadSerice();

// POST /api/upload - Single file upload endpoint with enhanced job creation
router.post("/", ensureUser, uploadMiddleware.single("video"), async (req: Request, res: Response) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            res.status(400).json({
                success: false,
                error: "No file uploaded. Please select a video file.",
                code: "NO_FILE",
            } as UploadResponse);
            return;
        }

        console.log(req.file, "userId", req.session.userId, "sessionId", req.sessionID, req.session.sessionId);

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

        // Process the uploaded file (but don't create job yet)
        const processedFile = await uploadService.processUploadFile(req.file, req.session.userId!);

        // Parse conversion settings from request body (if provided)
        // let conversionSettings = null;
        // if (req.body.conversionSettings) {
        //     try {
        //         conversionSettings =
        //             typeof req.body.conversionSettings === "string" ? req.body.conversionSettings : JSON.stringify(req.body.conversionSettings);
        //     } catch (error) {
        //         console.warn("Invalid conversion settings provided:", error);
        //     }
        // }

        // Create job using EnhancedJobService
        // const job = await EnhancedJobService.createJob({
        //     user_id: req.session.userId!,
        //     input_file: processedFile.file.path,
        //     conversion_settings: conversionSettings,
        //     file_size: processedFile.file.size,
        // });

        // Get enhanced job information
        // const enhancedJobInfo = await EnhancedJobService.getEnhancedJobDetails(job.id, req.session.userId!);

        // // Get queue statistics
        // const queueStats = EnhancedJobService.getQueueStats();

        // Return enhanced success response
        const response = {
            success: true,
            file: {
                originalName: processedFile.file.originalName,
                filename: processedFile.file.filename,
                path: processedFile.file.path,
                size: processedFile.file.size,
                mimetype: processedFile.file.mimetype,
                formattedSize: JobHelper.formatFileSize(processedFile.file.size),
            },
            job: {
                // id: job.id,
                // status: job.status,
                // input_file: job.input_file,
                // created_at: job.created_at,
                // file_size: job.file_size,
                // conversion_settings: job.conversion_settings,
                // // Enhanced job information
                // statusDescription: JobHelper.getStatusDescription(job.status),
                // estimatedCompletion: enhancedJobInfo.estimatedCompletion,
                // progress: enhancedJobInfo.progress,
                // healthStatus: enhancedJobInfo.healthStatus,
                // canRetry: enhancedJobInfo.canRetry,
                // canCancel: enhancedJobInfo.canCancel,
                // priority: JobHelper.getJobPriority(job),
                // progressMessage: JobHelper.getProgressMessage(job),
            },
            // queue: queueStats,
            // Additional metadata
            metadata: {
                uploadedAt: new Date().toISOString(),
                userId: req.session.userId!,
                jobCreated: true,
                queuedForProcessing: true,
            },
        };

        res.status(201).json(response);

        // Enhanced logging with job details
        console.log(`File uploaded and job created successfully:`, {
            originalName: processedFile.file.originalName,
            jobId: processedFile.jobId,
            userId: req.session.userId!,
            fileSize: JobHelper.formatFileSize(processedFile.file.size),
            // status: job.status,
            // queuePosition: queueStats.queued + 1,
        });

        // Optional: Start monitoring if not already running
        // JobMonitor.startMonitoring();
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
