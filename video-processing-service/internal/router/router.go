package router

import (
	"video-processor/internal/api"
	"video-processor/internal/config"
	"video-processor/internal/middleware"

	"github.com/gin-gonic/gin"
)

func SetUpRouter(cfg *config.Config) *gin.Engine {

	router := gin.New()

	// Add middleware
	router.Use(gin.Recovery())
	router.Use(middleware.CorsMiddleware())
	router.Use(middleware.LoggerMiddlware())

	// health check endpoint (public)

	router.GET("/health", api.HealthHandler(cfg))

	return router
}
