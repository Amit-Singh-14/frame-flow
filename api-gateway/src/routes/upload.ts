import { ensureUser } from "@/middlewares/session";
import { handleUploadError, uploadMiddleware } from "@/middlewares/upload";
import { UploadSerice } from "@/services/uploadService";
import { UploadResponse } from "@/types/upload";
import { Router, Request, Response } from "express";

const router = Router();
const uploadService = new UploadSerice();

// POST /api/upload - Single file upload endpoint
router.post("/", ensureUser, uploadMiddleware.single("video"), async (req: Request, res: Response) => {
    try {
        // check if file was uploaded
        if (!req.file) {
            res.status(400).json({
                success: false,
                error: "No file uploaded. Please select a video file.",
                code: "NO_FILE",
            } as UploadResponse);
            return;
        }

        // validate the uploaded file
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

        // Process the uploaded file and create job
        const { file, jobId } = await uploadService.processUploadFile(req.file, req.session.userId!);

        // Return success response
        const response: UploadResponse = {
            success: true,
            file: {
                originalName: file.originalName,
                filename: file.filename,
                path: file.path,
                size: file.size,
                mimetype: file.mimetype,
            },
            job: {
                id: jobId,
                status: "pending",
                input_file: file.path,
            },
        };

        res.status(201).json(response);

        // Log successful upload
        console.log(`File uploaded successfully: ${file.originalName} (Job ID: ${jobId})`);
    } catch (error) {
        console.error("Upload processing error:", error);
        // Clean up file if it exists
        if (req.file) {
            await uploadService.cancelUpload(req.file.path);
        }

        res.status(500).json({
            success: false,
            error: "Failed to process uploaded file. Please try again.",
            code: "PROCESSING_ERROR",
        } as UploadResponse);
    }
});

export default router;
