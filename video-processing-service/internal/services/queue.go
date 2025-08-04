package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
	"video-processor/internal/config"
	"video-processor/internal/models"
)

type JobQueueService struct {
	config *config.Config
	client *http.Client
	redis  *RedisService
}

func NewJobQueueService(cfg *config.Config) (*JobQueueService, error) {
	redisClient, err := NewRedisService(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create redis service: %w", err)
	}
	return &JobQueueService{
		config: cfg,
		client: &http.Client{Timeout: 30 * time.Second},
		redis:  redisClient,
	}, err
}

func (q *JobQueueService) GetNextJob(ctx context.Context) (*models.Job, error) {

	// fmt.Println("fetching new job from the queue....")
	jobId, err := q.redis.GetNextJob(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to get next job:%w", err)
	}

	if jobId == 0 {
		// No job available
		return nil, nil
	}

	url := fmt.Sprintf("%s/api/jobs/%d", q.config.APIGatewayURL, jobId)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)

	if err != nil {
		return nil, err
	}

	req.Header.Set("worker-id", q.config.WorkerID)
	req.Header.Set("Accept", "application/json")

	resp, err := q.client.Do(req)

	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNoContent {
		return nil, nil
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code from API: %d", resp.StatusCode)
	}
	var response struct {
		Success bool        `json:"success"`
		Job     *models.Job `json:"job"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("API gateway responded with success=false")
	}

	return response.Job, nil
}

func (q *JobQueueService) CompleteJob(ctx context.Context, jobId int, result *models.JobResult) error {

	data, _ := json.Marshal(result)

	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/api/queue/complete/%d", q.config.APIGatewayURL, jobId), bytes.NewReader(data))

	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("worker-id", q.config.WorkerID)

	resp, err := q.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return nil

}

func (q *JobQueueService) FailJob(ctx context.Context, jobId int, errorMessage string) error {

	data, _ := json.Marshal(map[string]interface{}{
		"errorMessage":   errorMessage,
		"errorCode":      "PROCESSING_ERROR",
		"errorRetriable": true,
	})

	req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s/api/queue/fail/%d", q.config.APIGatewayURL, jobId), bytes.NewReader(data))

	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("worker-id", q.config.WorkerID)

	resp, err := q.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return nil

}

func (q *JobQueueService) StartJob(ctx context.Context, jobID int) error {

	type res struct {
		WorkerID string `json:"worker_id"`
	}

	data, err := json.Marshal(res{
		WorkerID: q.config.WorkerID,
	})

	if err != nil {
		return fmt.Errorf("failed to marshal job progress: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST",
		fmt.Sprintf("%s/api/jobs/start/%d", q.config.APIGatewayURL, jobID),
		bytes.NewReader(data))

	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("worker-id", q.config.WorkerID)

	resp, err := q.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to update: %v", err)
	}

	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API returned error status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

func (q *JobQueueService) UpdateProgressStep(ctx context.Context, jobID int, step, statusDescription string) error {
	data, err := json.Marshal(models.JobProgress{
		JobID:             jobID,
		Step:              step,
		StatusDescription: statusDescription,
	})

	if err != nil {
		return fmt.Errorf("failed to marshal job progress: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST",
		fmt.Sprintf("%s/api/queue/progress/step/%d", q.config.APIGatewayURL, jobID),
		bytes.NewReader(data))

	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("worker-id", q.config.WorkerID)

	resp, err := q.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to update: %v", err)
	}

	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API returned error status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}
