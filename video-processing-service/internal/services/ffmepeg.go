package services

import (
	"context"
	"fmt"
	"os/exec"
	"video-processor/internal/config"
)

type FFmpegService struct {
	config *config.Config
}

func NewFFmpegService(cfg *config.Config) *FFmpegService {
	return &FFmpegService{
		config: cfg,
	}
}

func (f *FFmpegService) Transcode(ctx context.Context, input, output string, settings map[string]interface{}) error {
	args := []string{
		"-i", input,
		"-c:v", "libx264",
		"-c:a", "aac",
		"-y", // Overwrite output
		output,
	}

	cmd := exec.CommandContext(ctx, f.config.FFmpegPath, args...)

	return cmd.Run()
}

func (f *FFmpegService) Compress(ctx context.Context, input, output string, settings map[string]interface{}) error {
	args := []string{
		"-i", input,
		"-c:v", "libx264",
		"-crf", "28", // Higher compression
		"-c:a", "aac",
		"-y",
		output,
	}

	cmd := exec.CommandContext(ctx, f.config.FFmpegPath, args...)
	return cmd.Run()
}

func (f *FFmpegService) Resize(ctx context.Context, input, output string, settings map[string]interface{}) error {
	// Default to 720p if no size specified
	size := "1280:720"
	if s, ok := settings["size"].(string); ok {
		size = s
	}

	args := []string{
		"-i", input,
		"-vf", fmt.Sprintf("scale=%s", size),
		"-c:v", "libx264",
		"-c:a", "aac",
		"-y",
		output,
	}

	cmd := exec.CommandContext(ctx, f.config.FFmpegPath, args...)
	return cmd.Run()
}
