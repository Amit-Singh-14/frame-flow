package api

import (
	"net/http"
	"video-processor/internal/config"

	"github.com/gin-gonic/gin"
)

// HealthHandler returns the service health status
func HealthHandler(cfg *config.Config) gin.HandlerFunc {
	return func(ctx *gin.Context) {

		ctx.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "video-processor",
			"version": "1.0.0",
			"config": gin.H{
				"environment":   cfg.ENVIRONMENT,
				"apiGatewayURL": cfg.APIGatewayURL,
			},
		})

	}
}
