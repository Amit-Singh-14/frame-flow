import { UploadConfig } from "@/types/upload";
import { config } from "@/utils/config";
import { FileUtils } from "@/utils/file";
import { Request } from "express";
import multer from "multer";
import path from "path";
import mime from "mime-types";

const uploadConfig: UploadConfig = {
    maxFileSize: config.files.maxFileSize,
    allowedFormat: config.files.allowedVideoFormats,
    uploadDir: config.storage.uploadDir,
};

const createUploadDirectories = async () => {
    const directories = [
        uploadConfig.uploadDir,
        path.join(uploadConfig.uploadDir, "input"),
        path.join(uploadConfig.uploadDir, "output"),
        path.join(uploadConfig.uploadDir, "temp"),
        path.join(uploadConfig.uploadDir, "thumbnails"), // For storing thumbnails
        path.join(uploadConfig.uploadDir, "previews"), // For storing previews
    ];

    for (const dir of directories) {
        await FileUtils.ensureDirectoryExists(dir);
    }
};

// Initialize directories on module load
createUploadDirectories().catch(console.error);

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const inputDir = path.join(uploadConfig.uploadDir, "input");
        await FileUtils.ensureDirectoryExists(inputDir);
        cb(null, inputDir);
    },
    filename: (req, file, cb) => {
        const uniqueFilename = FileUtils.generateUniqueFileName(file.originalname);
        console.log("Generated unique filename:", uniqueFilename);
        cb(null, uniqueFilename);
    },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    try {
        // Security check - prevent potentially dangerous files
        const suspiciousExtensions = ["exe", "bat", "cmd", "com", "pif", "scr", "vbs", "js", "jar", "msi"];

        const hasSuspiciousExtension = suspiciousExtensions.some((ext) => file.originalname.toLowerCase().includes(`.${ext}`));

        if (hasSuspiciousExtension) {
            const error = new Error("File type not allowed for security reasons");
            (error as any).code = "SECURITY_REJECTION";
            return cb(error);
        }

        // Check MIME type
        const detectedMimeType = mime.lookup(file.originalname);
        const isVideoMimeType = detectedMimeType && detectedMimeType.startsWith("video/");

        // Check file extension
        const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
        const isAllowedExtension = uploadConfig.allowedFormat.includes(fileExtension);

        if (!isVideoMimeType && !isAllowedExtension) {
            const error = new Error(`Invalid file type. Allowed formats: ${uploadConfig.allowedFormat.join(", ")}`);
            (error as any).code = "INVALID_FILE_TYPE";
            return cb(error);
        }

        // Additional validation: check if file has proper extension
        if (!fileExtension) {
            const error = new Error("File must have a valid extension");
            (error as any).code = "MISSING_EXTENSION";
            return cb(error);
        }

        return cb(null, true);
    } catch (error) {
        return cb(error as Error);
    }
};

// Enhanced error handling middleware
const handleMulterError = (error: any, req: Request, res: any, next: any) => {
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case "LIMIT_FILE_SIZE":
                return res.status(400).json({
                    error: "File too large",
                    message: `File size must be less than ${uploadConfig.maxFileSize / (1024 * 1024)}MB`,
                    code: "FILE_TOO_LARGE",
                });
            case "LIMIT_FILE_COUNT":
                return res.status(400).json({
                    error: "Too many files",
                    message: "Only one file is allowed per upload",
                    code: "TOO_MANY_FILES",
                });
            case "LIMIT_UNEXPECTED_FILE":
                return res.status(400).json({
                    error: "Unexpected field",
                    message: "Unexpected file field in upload",
                    code: "UNEXPECTED_FIELD",
                });
            default:
                return res.status(400).json({
                    error: "Upload error",
                    message: error.message,
                    code: "UPLOAD_ERROR",
                });
        }
    }

    // Handle custom errors from fileFilter
    if (error.code === "SECURITY_REJECTION" || error.code === "INVALID_FILE_TYPE" || error.code === "MISSING_EXTENSION") {
        return res.status(400).json({
            error: "Invalid file",
            message: error.message,
            code: error.code,
        });
    }

    next(error);
};

// Multer instance for middleware
export const uploadMiddleware = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: uploadConfig.maxFileSize, // Use config value instead of hardcoded
        files: 1,
        fieldSize: 10 * 1024 * 1024, // 10MB for field data
    },
});

// Enhanced middleware with file metadata extraction
export const uploadWithMetadata = (fieldName: string = "video") => {
    return [
        uploadMiddleware.single(fieldName),
        handleMulterError,
        async (req: Request, res: any, next: any) => {
            if (req.file) {
                // Add file metadata to request for use in controllers
                req.fileMetadata = {
                    originalName: req.file.originalname,
                    fileName: req.file.filename,
                    filePath: req.file.path,
                    size: req.file.size,
                    mimeType: req.file.mimetype,
                    uploadedAt: new Date(),
                    // Additional metadata that will be populated by video processing
                    format: path.extname(req.file.originalname).toLowerCase().slice(1),
                    inputFile: req.file.path, // Full path for database storage
                };
            }
            next();
        },
    ];
};

// Export error handler for use in app-level error handling
export { handleMulterError };

// Type augmentation for Express Request
declare global {
    namespace Express {
        interface Request {
            fileMetadata?: {
                originalName: string;
                fileName: string;
                filePath: string;
                size: number;
                mimeType: string;
                uploadedAt: Date;
                format: string;
                inputFile: string;
            };
        }
    }
}

export { uploadConfig };
