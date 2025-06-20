import { JobModel } from "@/models/Job";
import { Job, JobStatus } from "@/types";

export interface StatusTransition {
    from: JobStatus;
    to: JobStatus;
    timestamp: string;
    reason?: string;
}

export interface JobStatusHistory {
    jobId: number;
    transtions: StatusTransition[];
}

export class JobStatusManger {
    // valid status transition mapping

    private static readonly VALID_TRANSITIONS: Map<JobStatus, JobStatus[]> = new Map([
        [JobStatus.PENDING, [JobStatus.PROCESSING, JobStatus.FAILED]],
        [JobStatus.PROCESSING, [JobStatus.COMPLETED, JobStatus.FAILED]],
        [JobStatus.COMPLETED, []], //completed job cannnot transition to other states
        [JobStatus.FAILED, [JobStatus.PENDING]], //failed jobs can only be retired
    ]);

    // in-memory status history storeage (TODO: IN PROD MOVE TO DATABASE)
    private static statusHistory: Map<number, StatusTransition[]> = new Map();

    // Estimated processing times (in minutes) - can be configured based on file size
    private static readonly ESTIMATE_TIMES: Map<JobStatus, number> = new Map([
        [JobStatus.PENDING, 0],
        [JobStatus.PROCESSING, 15], // deafult
        [JobStatus.COMPLETED, 0],
        [JobStatus.FAILED, 0],
    ]);

    static isValidTransition(currentStatus: JobStatus, newStatus: JobStatus): boolean {
        const allowedTransition = this.VALID_TRANSITIONS.get(currentStatus) || [];
        return allowedTransition.includes(newStatus);
    }

    static async transitionJobStatus(
        jobId: number,
        newStatus: JobStatus,
        output_file?: string,
        errorMessage?: string,
        reason?: string
    ): Promise<void> {
        try {
            const job = await JobModel.findById(jobId);
            if (!job) {
                throw new Error(`Job ${jobId} not found`);
            }

            // Validate transition
            if (!this.isValidTransition(job.status, newStatus)) {
                throw new Error(`Invalid status transition: ${job.status} -> ${newStatus} for job ${jobId}`);
            }

            // record transition in history
            this.recordStatusTransition(jobId, job.status, newStatus, reason);

            await JobModel.updateStatus(jobId, newStatus, output_file, errorMessage);

            console.log(`Job ${jobId} status transitioned: ${job.status} -> ${newStatus}${reason ? ` (${reason})` : ""}`);

            this.notifyStatusChange(job, newStatus, reason);
        } catch (error) {
            console.error(`Error transitioning job ${jobId} status:`, error);
            throw error;
        }
    }

    private static recordStatusTransition(jobId: number, fromStatus: JobStatus, toStatus: JobStatus, reason?: string): void {
        if (!this.statusHistory.has(jobId)) {
            this.statusHistory.set(jobId, []);
        }

        const transition: StatusTransition = {
            from: fromStatus,
            to: toStatus,
            timestamp: new Date().toISOString(),
            reason,
        };

        this.statusHistory.get(jobId)!.push(transition);
    }

    static getJobStatusHistory(jobId: number): StatusTransition[] {
        return this.statusHistory.get(jobId) || [];
    }

    // calculate esitmated completion time based on job status and file size
    static calculateEstimationTime(job: Job): Date | null {
        if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
            return null;
        }

        let estimatedMinutes = this.ESTIMATE_TIMES.get(job.status) || 0;

        // adjust based on file size(larger file take longer)
        if (job.file_size) {
            const sizeInMB = job.file_size / (1024 * 1024);
            estimatedMinutes += Math.ceil(sizeInMB / 10);
        }

        if (estimatedMinutes == 0) {
            return null;
        }

        const esitmatedTime = new Date();
        esitmatedTime.setMinutes(esitmatedTime.getMinutes() + estimatedMinutes);

        return esitmatedTime;
    }

    static getJobProgress(job: Job): number {
        switch (job.status) {
            case JobStatus.PENDING:
                return 0;
            case JobStatus.PROCESSING:
                return 50; // TODO: enhnace with actual progress tracking
            case JobStatus.COMPLETED:
                return 100;
            case JobStatus.FAILED:
                return 0;
            default:
                return 0;
        }
    }

    private static notifyStatusChange(job: Job, newStatus: JobStatus, reason?: string): void {
        // TODO: implement actual notfication system
        console.log(`[NOTIFICATION] Job ${job.id} status changed to ${newStatus}`, {
            jobId: job.id,
            userId: job.user_id,
            status: newStatus,
            reason,
            timestamp: new Date().toISOString(),
        });
    }

    //   Get jobs that need status validation/cleanup
    static async getJobsRequiringValidation(): Promise<Job[]> {
        try {
            // Get all non-completed jobs
            const pendingJobs = await JobModel.findPendingJobs();
            // TODO: Add method to get processing jobs from JobModel

            return pendingJobs.filter((job) => {
                // Check if job has been pending too long
                const createdTime = new Date(job.created_at).getTime();
                const now = new Date().getTime();
                const hoursSinceCreated = (now - createdTime) / (1000 * 60 * 60);

                // Flag jobs pending for more than 1 hour
                return hoursSinceCreated > 1;
            });
        } catch (error) {
            console.error("Error getting jobs requiring validation:", error);
            throw error;
        }
    }

    // Reset status history for a job (useful for cleanup)
    static clearJobStatusHistory(jobId: number): void {
        this.statusHistory.delete(jobId);
    }

    // Get all jobs with their current status and history

    static async getJobsWithStatusDetails(userId: number): Promise<
        Array<
            Job & {
                statusHistory: StatusTransition[];
                estimatedCompletion: Date | null;
                progress: number;
            }
        >
    > {
        try {
            const jobs = await JobModel.findByUserId(userId);

            return jobs.map((job) => ({
                ...job,
                statusHistory: this.getJobStatusHistory(job.id),
                estimatedCompletion: this.calculateEstimationTime(job),
                progress: this.getJobProgress(job),
            }));
        } catch (error) {
            console.error("Error getting jobs with status details:", error);
            throw error;
        }
    }

    // Validate and fix inconsistent job states

    static async validateAndFixJobStates(): Promise<{ fixed: number; issues: string[] }> {
        const issues: string[] = [];
        let fixedCount = 0;

        try {
            const jobsToValidate = await this.getJobsRequiringValidation();

            for (const job of jobsToValidate) {
                const issue = `Job ${job.id} has been ${job.status} for too long`;
                issues.push(issue);

                // Auto-fix: mark long-pending jobs as failed
                if (job.status === JobStatus.PENDING) {
                    await this.transitionJobStatus(
                        job.id,
                        JobStatus.FAILED,
                        undefined,
                        "Job timed out - was pending too long",
                        "Auto-cleanup: timeout"
                    );
                    fixedCount++;
                }
            }

            return { fixed: fixedCount, issues };
        } catch (error) {
            console.error("Error validating job states:", error);
            throw error;
        }
    }
}
