export interface UploadConfig {
    maxFileSize: number;
    allowedFormat: string[];
    uploadDir: string;
}

export interface UploadFile {
    originalName: string;
    filename: string;
    path: string;
    size: number;
    mimetype: string;
}

export interface UploadResponse {
    success: boolean;
    file?: UploadFile;
    job?: {
        id: number;
        status: string;
        input_file: string;
    };
    error?: string;
}
