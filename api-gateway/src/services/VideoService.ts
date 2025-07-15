import { CreateVideoData, UpdateVideoData, Video, VideoRepository } from "@/Repository/Video";

class VideoService {
    async createVideo(data: CreateVideoData): Promise<Video> {
        return await VideoRepository.create(data);
    }

    async getVideoById(id: number): Promise<Video | null> {
        return await VideoRepository.findById(id);
    }

    async getVideoByIdAndUser(id: number, userId: number): Promise<Video | null> {
        return await VideoRepository.findByIdAndUser(id, userId);
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
        return await VideoRepository.findAllByUser(userId, options);
    }

    async updateVideo(id: number, data: UpdateVideoData): Promise<Video | null> {
        return await VideoRepository.update(id, data);
    }

    async softDeleteVideo(id: number): Promise<boolean> {
        return await VideoRepository.softDelete(id);
    }

    async hardDeleteVideo(id: number): Promise<boolean> {
        return await VideoRepository.hardDelete(id);
    }

    async getVideoCount(userId: number, isActive?: boolean): Promise<number> {
        return await VideoRepository.countByUser(userId, isActive);
    }

    async getVideosByFormat(format: string, userId?: number): Promise<Video[]> {
        return await VideoRepository.findByFormat(format, userId);
    }

    async searchVideosByTitle(searchTerm: string, userId?: number): Promise<Video[]> {
        return await VideoRepository.searchByTitle(searchTerm, userId);
    }

    async getUserStorageStats(userId: number) {
        return await VideoRepository.getStorageStats(userId);
    }
}

export const videoService = new VideoService();
