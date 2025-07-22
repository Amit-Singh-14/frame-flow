package utils

import (
	"log"
	"video-processor/internal/config"

	"github.com/gin-gonic/gin"
)

// setup Logging
func SetupLogging(cfg *config.Config) {
	if cfg.ENVIRONMENT == "production" {
		gin.SetMode(gin.ReleaseMode)

		// Configure structured logging for production
		log.SetFlags(log.LstdFlags | log.Lmicroseconds | log.LUTC)
	} else {
		gin.SetMode(gin.DebugMode)

		// More verbose logging for development
		log.SetFlags(log.LstdFlags | log.Lshortfile)
	}
}
