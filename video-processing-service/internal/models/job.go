package models

import "time"

type Job struct {
	ID                 int                    `json:"id"`
	UserID             int                    `json:"user_id"`
	VideoID            int                    `json:"video_id"`
	Title              string                 `json:"title"`
	JobType            string                 `json:"job_type"`
	ConversionSettings map[string]interface{} `json:"conversion_settings"`
	InputFile          string                 `json:"input_file"`
	Priority           int                    `json:"priority"`
	RetryCount         int                    `json:"retry_count"`
	CreatedAt          time.Time              `json:"created_at"`
}

type JobResult struct {
	JobID        int    `json:"job_id"`
	OutputFile   string `json:"output_file"`
	PreviewURL   string `json:"preview_url,omitempty"`
	ThumbnailURL string `json:"thumbnail_url,omitempty"`
}

type JobProgress struct {
	JobID             int    `json:"job_id"`
	HealthStatus      string `json:"health_status"`
	StatusDescription string `json:"status_description"`
}
