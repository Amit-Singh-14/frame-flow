import ffmpeg from "fluent-ffmpeg";

export interface VideoMetadata {
    duration?: number; // in seconds
    resolution: string; // e.g. "1920x1080"
    format?: string;
    codec: string;
    bitrate?: number;
    size?: number; // in bytes if available
}

export class VideoMetadataExtractor {
    static extractMetadata(filePath: string): Promise<VideoMetadata> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) {
                    console.error("FFprobe error:", err);
                    return reject(err);
                }

                try {
                    const format = metadata.format.format_name;
                    const duration = metadata.format.duration;
                    const bitrate = metadata.format.bit_rate;
                    const size = metadata.format.size;

                    const videoStream = metadata.streams.find((s) => s.codec_type === "video");
                    const width = videoStream?.width || 0;
                    const height = videoStream?.height || 0;
                    const resolution = `${width}x${height}`;
                    const codec = videoStream?.codec_name || "unknown";

                    resolve({
                        duration: duration ? Math.round(duration) : 0,
                        resolution,
                        format,
                        codec,
                        bitrate,
                        size,
                    });
                } catch (e) {
                    console.error("Metadata extraction error:", e);
                    reject(e);
                }
            });
        });
    }
}
