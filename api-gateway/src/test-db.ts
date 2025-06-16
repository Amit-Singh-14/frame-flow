import { UserModel } from "./models/User";
import { JobModel } from "./models/Job";
import { JobStatus } from "./types";
import { initialzeDatabase } from "./database/schema";

async function testDatabase() {
    try {
        // Initialize database
        await initialzeDatabase();

        // Test user creation
        console.log("Testing user creation...");
        const user = await UserModel.findOrCreate("test-session-123");
        console.log("Created user:", user);

        // Test job creation
        console.log("Testing job creation...");
        const job = await JobModel.create({
            user_id: user.id,
            input_file: "test-video.mp4",
            conversion_settings: JSON.stringify({ format: "mp4", quality: "720p" }),
            file_size: 1024000,
        });
        console.log("Created job:", job);

        // Test job status update
        console.log("Testing job status update...");
        await JobModel.updateStatus(job.id, JobStatus.COMPLETED, "output-video.mp4");

        // Test job retrieval
        const updatedJob = await JobModel.findById(job.id);
        console.log("Updated job:", updatedJob);

        // Test user jobs
        const userJobs = await JobModel.findByUserId(user.id);
        console.log("User jobs:", userJobs);

        // Test job stats
        const stats = await JobModel.getJobStats(user.id);
        console.log("Job stats:", stats);

        console.log("✅ All database tests passed!");
    } catch (error) {
        console.error("❌ Database test failed:", error);
    }

    process.exit(0);
}

testDatabase();
