export class JobQueue {
    private queue: number[] = [];
    private processing: Set<number> = new Set();

    enqueue(jobId: number): void {
        if (!this.queue.includes(jobId) && !this.processing.has(jobId)) {
            this.queue.push(jobId);
            console.log(`Job ${jobId} added to queue. Queue length: ${this.queue.length}`);
        }
    }

    dequeue(): number | null {
        const jobId = this.queue.shift();
        if (jobId) {
            this.processing.add(jobId);
            console.log(`Job ${jobId} dequeued for processing. Queue length: ${this.queue.length}`);
        }
        return jobId || null;
    }

    markCompleted(jobId: number): void {
        this.processing.delete(jobId);
        console.log(`Job ${jobId} marked as completed. Processing: ${this.processing.size}`);
    }

    markFailed(jobId: number): void {
        this.processing.delete(jobId);
        console.log(`Job ${jobId} marked as failed. Processing: ${this.processing.size}`);
    }

    getQueueStats() {
        return {
            queued: this.queue.length,
            processing: this.processing.size,
            totalInProgress: this.queue.length + this.processing.size,
        };
    }

    peek(): number | null {
        return this.queue[0] || null;
    }

    isProcessing(jobId: number): boolean {
        return this.processing.has(jobId);
    }

    removeFromQueue(jobId: number): boolean {
        const index = this.queue.indexOf(jobId);
        if (index > -1) {
            this.queue.splice(index, 1);
            return true;
        }
        return this.processing.delete(jobId);
    }
}
