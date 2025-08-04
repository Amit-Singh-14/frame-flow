package config

import (
	"os"
	"time"
)

type Config struct {
	PORT            string
	ENVIRONMENT     string
	APIGatewayURL   string
	WorkerID        string
	PollInterval    int
	FFmpegPath      string
	InputDir        string
	OutputDir       string
	ShutdownTimeout time.Duration

	REDISURL      string
	QUERYKEY      string
	PROCESSINGKEY string
}

func LoadConfig() *Config {
	return &Config{
		APIGatewayURL:   getEnv("API_GATEWAY_URL", "http://localhost:3000"),
		WorkerID:        getEnv("WORKER_ID", "worker-1"),
		PollInterval:    5,
		FFmpegPath:      getEnv("FFMPEG_PATH", "ffmpeg"),
		InputDir:        getEnv("INPUT_DIR", "./uploads"),
		OutputDir:       getEnv("OUTPUT_DIR", "./outputs"),
		PORT:            getEnv("PORT", "8080"),
		ENVIRONMENT:     getEnv("ENVIRONMENT", "development"),
		ShutdownTimeout: time.Duration(10) * time.Second,

		REDISURL:      getEnv("REDISURL", "localhost:6379"),
		QUERYKEY:      getEnv("QUERYKEY", "videoJobs:queue"),
		PROCESSINGKEY: getEnv("PROCESSINGKEY", "video_jobs:processing"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
