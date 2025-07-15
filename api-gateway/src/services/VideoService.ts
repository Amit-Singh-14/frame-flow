import { CreateVideoData, UpdateVideoData, Video, VideoModel } from "@/models/Video";

class VideoService {
    async createVideo(data: CreateVideoData): Promise<Video> {
        return await VideoModel.create(data);
    }

    async getVideoById(id: number): Promise<Video | null> {
        return await VideoModel.findById(id);
    }

    async getVideoByIdAndUser(id: number, userId: number): Promise<Video | null> {
        return await VideoModel.findByIdAndUser(id, userId);
    }

    async getUserVideos(
        userId: number,
        options?: {
            limit?: number;
            offset?: number;
            isActive?: boolean;
            orderBy?: "uploaded_at" | "title" | "file_size";
            orderDir?: "ASC" | "DESC";
        }
    ): Promise<Video[]> {
        return await VideoModel.findAllByUser(userId, options);
    }

    async updateVideo(id: number, data: UpdateVideoData): Promise<Video | null> {
        return await VideoModel.update(id, data);
    }

    async softDeleteVideo(id: number): Promise<boolean> {
        return await VideoModel.softDelete(id);
    }

    async hardDeleteVideo(id: number): Promise<boolean> {
        return await VideoModel.hardDelete(id);
    }

    async getVideoCount(userId: number, isActive?: boolean): Promise<number> {
        return await VideoModel.countByUser(userId, isActive);
    }

    async getVideosByFormat(format: string, userId?: number): Promise<Video[]> {
        return await VideoModel.findByFormat(format, userId);
    }

    async searchVideosByTitle(searchTerm: string, userId?: number): Promise<Video[]> {
        return await VideoModel.searchByTitle(searchTerm, userId);
    }

    async getUserStorageStats(userId: number) {
        return await VideoModel.getStorageStats(userId);
    }
}

export const videoService = new VideoService();
