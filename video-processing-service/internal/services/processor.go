package services

import (
	"context"
	"fmt"
	"log"
	"time"
	"video-processor/internal/config"
	"video-processor/internal/models"
)

type Processor struct {
	config *config.Config
	queue  *JobQueueService
	ffmpeg *FFmpegService
}

func NewProcessor(cfg *config.Config) (*Processor, error) {

	queueService, err := NewJobQueueService(cfg)

	if err != nil {
		return nil, fmt.Errorf("failed to create queue service: %w", err)
	}

	return &Processor{
		config: cfg,
		queue:  queueService,
		ffmpeg: NewFFmpegService(cfg),
	}, nil
}

func (p *Processor) Start(ctx context.Context) error {
	log.Printf("Worker %s started", p.config.WorkerID)
	log.Println("Starting job processor...")

	time.Sleep(3 + time.Second)
	ticker := time.NewTicker(1 * time.Second) // Poll every second
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("Stopping job processor.....")
			return ctx.Err()
		case <-ticker.C:
			job, err := p.queue.GetNextJob(ctx)
			if err != nil {
				log.Printf("Error getting job: %v", err)
				// Notify API gateway of error if needed
				continue
			}
			if job == nil {
				// No job available, continue polling
				continue
			}
			go func(job *models.Job) {
				if err := p.handleJob(ctx, job); err != nil {
					log.Printf("Error while processing job %d: %v", job.ID, err)
				}
			}(job)
		}
	}
}

func (p *Processor) handleJob(ctx context.Context, job *models.Job) error {

	log.Printf("[Worker %s] Processing job: ID=%d, Type=%s", p.config.WorkerID, job.ID, job.JobType)

	if err := p.queue.StartJob(ctx, job.ID); err != nil {
		log.Printf("Failed to start job %d: %v", job.ID, err)
		return fmt.Errorf("failed to start job: %v", err)
	}

	var (
		result *models.JobResult
		err    error
	)

	switch job.JobType {
	case "transcode":
		fmt.Printf("transcoding job started... %v", job.ID)
		result, err = p.transcodeVideo(ctx, job)
	case "compress":
		fmt.Printf("compressVideo job started... %v", job.ID)
		result, err = p.compressVideo(ctx, job)
	case "resize":
		fmt.Printf("resizeVideo job started... %v", job.ID)
		result, err = p.resizeVideo(ctx, job)
	default:
		err = fmt.Errorf("unsupported job type: %s", job.JobType)
	}

	if err != nil {
		log.Printf("Job %d failed: %v", job.ID, err)
		return p.queue.FailJob(ctx, job.ID, err.Error())
	}

	// Complete job
	if result != nil {
		return p.queue.CompleteJob(ctx, job.ID, result)
	}
	return nil

}

func (p *Processor) transcodeVideo(ctx context.Context, job *models.Job) (*models.JobResult, error) {

	// inputPath := fmt.Sprintf("%s/%s", p.config.InputDir, job.InputFile)
	// outputPath := fmt.Sprintf("%s/processed_%d_%s", p.config.OutputDir, job.ID, job.InputFile)

	// udpated progress
	time.Sleep(10 * time.Second)
	err := p.queue.UpdateProgressStep(ctx, job.ID, "transcoding_started", "transcoding started....")
	if err != nil {
		return nil, err
	}

	// call ffmpeg
	// err := p.ffmpeg.Transcode(ctx, inputPath, outputPath, job.ConversionSettings)

	// if err != nil {
	time.Sleep(10 * time.Second)
	return nil, fmt.Errorf("testing error")
	// }

	// return &models.JobResult{
	// 	JobID:      job.ID,
	// 	OutputFile: outputPath,
	// }, nil

	return nil, nil
}

func (p *Processor) compressVideo(ctx context.Context, job *models.Job) (*models.JobResult, error) {

	// inputPath := fmt.Sprintf("%s/%s", p.config.InputDir, job.InputFile)
	outputPath := fmt.Sprintf("%s/processed_%d_%s", p.config.OutputDir, job.ID, job.InputFile)

	// p.queue.UpdateProgress(ctx, job.ID, "processing", "Compressing video...")

	// err := p.ffmpeg.Compress(ctx, inputPath, outputPath, job.ConversionSettings)

	// if err != nil {
	// 	return nil, fmt.Errorf("compress failed: %w", err)
	// }

	return &models.JobResult{
		JobID:      job.ID,
		OutputFile: outputPath,
	}, nil
}

func (p *Processor) resizeVideo(ctx context.Context, job *models.Job) (*models.JobResult, error) {

	// inputPath := fmt.Sprintf("%s/%s", p.config.InputDir, job.InputFile)
	outputPath := fmt.Sprintf("%s/processed_%d_%s", p.config.OutputDir, job.ID, job.InputFile)

	// p.queue.UpdateProgress(ctx, job.ID, "processing", "Resizing video...")

	// err := p.ffmpeg.Resize(ctx, inputPath, outputPath, job.ConversionSettings)

	// if err != nil {
	// 	return nil, fmt.Errorf("compress failed: %w", err)
	// }

	return &models.JobResult{
		JobID:      job.ID,
		OutputFile: outputPath,
	}, nil

}
