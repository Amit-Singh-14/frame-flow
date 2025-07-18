import { jobService } from "@/services/jobService";
import { redisQueueService } from "@/services/redisQueueService";

async function testQueue() {
    // Create a test job
    const job = await jobService.create({
        status: "queued",
        created_at: new Date().toISOString(),
        user_id: 1,
        video_id: 1,
        title: "Test Job",
        job_type: "transcode",
        conversion_settings: JSON.stringify({ format: "mp4" }),
    });

    console.log("Job created:", job.id);

    // Get next job
    const nextJob = await redisQueueService.getNextJob();
    console.log("Next job:", nextJob);

    // Get queue stats
    const stats = await redisQueueService.getQueueStats();
    console.log("Queue stats:", stats);
}

testQueue().catch(console.error);
