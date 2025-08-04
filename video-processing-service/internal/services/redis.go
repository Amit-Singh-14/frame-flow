package services

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"time"
	"video-processor/internal/config"

	"github.com/redis/go-redis/v9"
)

type RedisService struct {
	client        *redis.Client
	queryKey      string
	processingKey string
}

func NewRedisService(cfg *config.Config) (*RedisService, error) {

	client, err := newRedisClient(cfg)

	if err != nil {
		return nil, fmt.Errorf("failed to create redis client: %w", err)
	}

	return &RedisService{
		client:        client,
		queryKey:      cfg.QUERYKEY,
		processingKey: cfg.PROCESSINGKEY,
	}, nil
}

func newRedisClient(cfg *config.Config) (*redis.Client, error) {

	rdb := redis.NewClient(&redis.Options{
		Addr:         cfg.REDISURL,
		Password:     "",
		DB:           0,
		PoolSize:     10,
		MinIdleConns: 5,
		MaxRetries:   3,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	})

	// test connection with context
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)

	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis connection failed: %w", err)
	}

	return rdb, nil

}

// GetNextJob retrieves the next job from the priority queue
func (rs *RedisService) GetNextJob(ctx context.Context) (int64, error) {

	result, err := rs.client.ZPopMin(ctx, rs.queryKey).Result()

	if err != nil {
		if err == redis.Nil {
			// No job available
			return 0, nil
		}
		return 0, fmt.Errorf("failed to get job from queue: %w", err)
	}

	if len(result) == 0 {
		return 0, nil
	}
	// parse jobId from the result
	jobIdStr := result[0].Member.(string)
	jobId, err := strconv.ParseInt(jobIdStr, 10, 64)

	if err != nil {
		return 0, fmt.Errorf("invalid jobId format: %w", err)
	}

	// Move to processsing set
	if err := rs.client.SAdd(ctx, rs.processingKey, jobIdStr).Err(); err != nil {
		// if we can't add to proceesing set, we should put the job back in queue
		rs.client.ZAdd(ctx, rs.queryKey, redis.Z{
			Score:  result[0].Score,
			Member: jobIdStr,
		})

		return 0, fmt.Errorf("failed to add job to processing set: %w", err)
	}

	// update hob status
	jobKey := fmt.Sprintf("job:%d", jobId)
	now := time.Now().Format(time.RFC3339)

	updateFields := map[string]interface{}{
		"status":      "processing",
		"processedAt": now,
	}

	if err := rs.client.HSet(ctx, jobKey, updateFields).Err(); err != nil {
		// if status udpate failds, remove from processing set and put back in queue
		rs.client.SRem(ctx, rs.processingKey, jobIdStr)
		rs.client.ZAdd(ctx, rs.queryKey, redis.Z{
			Score:  result[0].Score,
			Member: jobIdStr,
		})

		return 0, fmt.Errorf("failed to update job status: %w", err)
	}

	log.Printf("Job %d retrived from queue for processing", jobId)

	return jobId, nil

}

func (rs *RedisService) Close() error {
	return rs.client.Close()
}

func (rs *RedisService) Ping(ctx context.Context) error {
	return rs.client.Ping(ctx).Err()
}
