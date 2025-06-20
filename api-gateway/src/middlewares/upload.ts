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

const createUploadLoadDirectories = async () => {
    const directories = [
        uploadConfig.uploadDir,
        path.join(uploadConfig.uploadDir, "input"),
        path.join(uploadConfig.uploadDir, "output"),
        path.join(uploadConfig.uploadDir, "temp"),
    ];

    for (const dir of directories) {
        await FileUtils.ensureDirectoryExists(dir);
    }
};

// initilize directories on module load

createUploadLoadDirectories().catch(console.error);

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const inputDir = path.join(uploadConfig.uploadDir, "input");
        await FileUtils.ensureDirectoryExists(inputDir);
        cb(null, inputDir);
    },
    filename: (req, file, cb) => {
        const uniqueFilename = FileUtils.generateUniqueFileName(file.originalname);
        cb(null, uniqueFilename);
    },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    try {
        // security check
        const suspiciousExtensions = ["exe", "bat", "cmd", "com", "pif", "scr", "vbs", "js"];

        const hasSuspiciousExtension = suspiciousExtensions.some((ext) => file.originalname.toLowerCase().includes(`.${ext}`));

        if (hasSuspiciousExtension) {
            const error = new Error("File type not allowed for security reasons");
            (error as any).code = "SECURITY_REJECTION";
            return cb(error);
        }

        // check MIME type
        const detectedMineType = mime.lookup(file.originalname);
        const isVideoMimeType = detectedMineType && detectedMineType.startsWith("video/");

        // check file extension
        const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
        const isAllowedExtension = uploadConfig.allowedFormat.includes(fileExtension);

        if (!isVideoMimeType && !isAllowedExtension) {
            const error = new Error(`Invalid file Type. Allowed formats: ${uploadConfig.allowedFormat.join(", ")}`);
            (error as any).code = "INVALID_FILE_TYPE";
            return cb(error);
        }

        return cb(null, true);
    } catch (error) {
        return cb(error as Error);
    }
};

// multer instance for middlware
console.log(uploadConfig);
export const uploadMiddleware = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024,
        files: 1,
    },
});

// error hanlding middleware for multer errors

export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
    console.log("here");
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case "LIMIT_FILE_SIZE":
                return res.status(400).json({
                    error: `File too large. Maximum size allowed: ${FileUtils.formatFileSize(uploadConfig.maxFileSize)}`,
                    code: "FILE_TOO_LARGE",
                });
            case "LIMIT_FILE_COUNT":
                return res.status(400).json({
                    error: "Too many files. Only one file allowed per upload.",
                    code: "TOO_MANY_FILES",
                });
            case "LIMIT_UNEXPECTED_FILE":
                return res.status(400).json({
                    error: 'Unexpected field name. Use "video" as the field name.',
                    code: "UNEXPECTED_FIELD",
                });
            default:
                return res.status(400).json({
                    error: "Upload error occurred",
                    code: "UPLOAD_ERROR",
                    details: error.message,
                });
        }
    }

    if (error.code === "INVALID_FILE_TYPE" || error.code === "SECURITY_REJECTION") {
        return res.status(400).json({
            error: error.message,
            code: error.code,
        });
    }

    next(error);
};

// Cleanup scheduled job (run every hour)
setInterval(() => {
    const tempDir = path.join(uploadConfig.uploadDir, "temp");
    FileUtils.cleanUpOldFiles(tempDir, 1); // Clean temp files older than 1 hour
}, 60 * 60 * 1000);

export { uploadConfig };
