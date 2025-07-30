package main

import (
	"context"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"
	"video-processor/internal/config"
	"video-processor/internal/router"
	"video-processor/internal/utils"
)

func main() {

	// Load configuration
	cfg := config.LoadConfig()

	// SetUp logging
	utils.SetupLogging(cfg)

	router := router.SetUpRouter(cfg)

	// configure HTTP server
	server := &http.Server{
		Addr:        ":" + cfg.PORT,
		Handler:     router,
		ReadTimeout: time.Duration(5 * time.Second),
	}

	// creating context that listens for the interrupt signal from the os
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)

	defer stop()

	// start the server in a goroutine
	go func() {

		log.Printf("Server starting on port %s in %s mode", cfg.PORT, cfg.ENVIRONMENT)
		log.Printf("API Gateway URL: %s", cfg.APIGatewayURL)

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}

	}()

	// Listen for the interrupt signal
	<-ctx.Done()

	// Restore default behavior on the interrupt signal and notify user of shutdown
	stop()

	log.Printf("Shutting down gracefully, press Ctrl+C again to force")

	// Create a deadline to wait for
	ctx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)

	defer cancel()

	// Doesnt block if no connections, but will otherwise wait until the timeout deadline
	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exiting")

}
