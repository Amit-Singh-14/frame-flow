import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || "3000"),
    nodeEnv: process.env.NODE_ENV || "development",

    database: {
        path: process.env.DB_PATH || "./database.sqlite",
    },

    storage: {
        uploadDir: process.env.UPLOAD_DIR || "./uploads",
        outputDir: process.env.OUTPUT_DIR || "./outputs",
    },

    services: {
        goServiceUrl: process.env.GO_SERVICE_URL || "http://localhost:8080",
    },

    session: {
        secret: process.env.SESSION_SECRET || "change-this-secret-key",
    },
    files: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "100000000"),
        allowedVideoFormats: (process.env.ALLOWED_VIDEO_FORMATS || "mp4,avi,mov,wmv,flv,webm,mkv").split(","),
    },
};

[config.storage.uploadDir, config.storage.outputDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});
