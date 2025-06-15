# Distributed Video Processing Pipeline - System Architecture

## 🏗️ Overall Architecture

The system follows a microservices architecture with clear separation of concerns:

- **Frontend Layer**: React-based user interface
- **API Gateway**: Node.js service handling web requests and authentication
- **Processing Layer**: Go-based video processing workers
- **Storage Layer**: PostgreSQL database and file storage
- **Message Queue**: Redis for job distribution and real-time communication

## 🔧 Technology Stack

### Frontend (React)
```
- React 18+ with Hooks
- React Router for navigation
- Socket.io-client for real-time updates
- Axios for API calls
- Tailwind CSS for styling
- React Query for state management
```

### API Gateway (Node.js)
```
- Express.js with TypeScript
- Socket.io for WebSocket connections
- JWT for authentication
- Multer for file uploads
- Redis client for caching
- Prisma/TypeORM for database
```

### Processing Engine (Go)
```
- Gin/Fiber for HTTP framework
- Gorilla WebSocket for real-time communication
- Redis client for job queuing
- GORM for database operations
- FFmpeg integration via os/exec
- Prometheus for metrics
```

### Storage & Infrastructure
```
- PostgreSQL for relational data
- Redis for caching and job queues
- Local filesystem + AWS S3/MinIO
- Docker for containerization
- Nginx for reverse proxy
```

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Jobs Table
```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    output_path VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending',
    processing_options JSONB,
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);
```

### Processing History Table
```sql
CREATE TABLE processing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id),
    worker_id VARCHAR(100),
    operation VARCHAR(50),
    status VARCHAR(20),
    duration_ms INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 API Endpoints

### Node.js API Gateway

#### Authentication
```
POST /auth/register        - User registration
POST /auth/login          - User login
POST /auth/refresh        - Token refresh
POST /auth/logout         - User logout
```

#### File Operations
```
POST /upload              - Upload video file
GET /jobs                 - List user jobs
GET /jobs/:id             - Get job details
GET /jobs/:id/download    - Download processed video
DELETE /jobs/:id          - Delete job
```

#### WebSocket Events
```
connection                - Client connection
join_room                 - Join job-specific room
leave_room               - Leave job room
progress_update          - Real-time progress
job_complete             - Job completion notification
error_notification       - Error alerts
```

### Go Processing Service

#### Internal API
```
POST /process             - Submit processing job
GET /jobs/:id/status      - Get job status
PUT /jobs/:id/progress    - Update job progress
DELETE /jobs/:id          - Cancel job
GET /health               - Health check
GET /metrics              - Prometheus metrics
```

## 🏃‍♂️ Worker Pool Architecture

### Worker Types
```go
type WorkerPool struct {
    jobChannel    chan Job
    workerChannel chan Worker
    maxWorkers    int
    quit          chan bool
}

type Worker struct {
    ID         string
    WorkerPool chan Worker
    JobChannel chan Job
    quit       chan bool
}
```

### Job Processing Pipeline
1. **Job Intake**: Receive job from Redis queue
2. **File Validation**: Check file format and size
3. **Pre-processing**: Extract metadata, create thumbnails
4. **Main Processing**: Apply transformations (resize, convert, compress)
5. **Post-processing**: Generate analytics, create preview
6. **Cleanup**: Remove temporary files, update database
7. **Notification**: Send completion status via WebSocket

## 📡 Real-time Communication

### WebSocket Architecture
```javascript
// Client Connection
const socket = io('ws://localhost:3001', {
  auth: { token: localStorage.getItem('jwt') }
});

// Job Progress Updates
socket.on('job_progress', (data) => {
  updateProgressBar(data.jobId, data.progress);
});

// Job Completion
socket.on('job_complete', (data) => {
  showNotification('Job completed successfully!');
});
```

### Redis Pub/Sub
```go
// Go Worker Publishing Updates
func (w *Worker) publishProgress(jobId string, progress int) {
    data := map[string]interface{}{
        "jobId":    jobId,
        "progress": progress,
        "workerId": w.ID,
    }
    w.redisClient.Publish("job_updates", data)
}
```

## 🔐 Security Measures

### Authentication & Authorization
- JWT tokens with expiration
- Role-based access control (RBAC)
- File upload size limits
- File type validation
- Rate limiting on API endpoints

### Data Protection
- Password hashing with bcrypt
- HTTPS enforcement
- CORS configuration
- SQL injection prevention
- XSS protection headers

## 📈 Monitoring & Observability

### Metrics Collection
```go
// Prometheus metrics in Go service
var (
    jobsProcessed = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "jobs_processed_total",
            Help: "Total number of jobs processed",
        },
        []string{"status", "worker_id"},
    )
    
    processingDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "job_processing_duration_seconds",
            Help: "Job processing duration in seconds",
        },
        []string{"operation"},
    )
)
```

### Logging Strategy
- Structured logging with JSON format
- Log levels: DEBUG, INFO, WARN, ERROR
- Centralized logging with correlation IDs
- Error tracking and alerting

## 🚀 Deployment Architecture

### Docker Compose Setup
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
  
  api-gateway:
    build: ./api-gateway
    ports: ["3001:3001"]
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/videoprocessing
      - REDIS_URL=redis://redis:6379
  
  processing-service:
    build: ./processing-service
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/videoprocessing
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./storage:/app/storage
  
  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=videoprocessing
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

## 🔧 Configuration Management

### Environment Variables
```bash
# Node.js API Gateway
NODE_ENV=production
PORT=3001
JWT_SECRET=your-secret-key
DATABASE_URL=postgresql://user:pass@localhost:5432/videoprocessing
REDIS_URL=redis://localhost:6379
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=100MB

# Go Processing Service
GO_ENV=production
PORT=8080
DATABASE_URL=postgresql://user:pass@localhost:5432/videoprocessing
REDIS_URL=redis://localhost:6379
WORKER_COUNT=4
FFMPEG_PATH=/usr/bin/ffmpeg
STORAGE_PATH=/app/storage
```

## 🎯 Performance Optimizations

### Caching Strategy
- Redis caching for job status and metadata
- CDN for static file delivery
- Database query optimization with indexes
- Connection pooling for database connections

### Concurrency Patterns
- Go goroutines for parallel processing
- Worker pool pattern for job distribution
- Circuit breaker pattern for external services
- Graceful shutdown handling

## 📋 Development Roadmap

### Phase 1: Core Infrastructure (Weeks 1-2)
- Set up Node.js API with authentication
- Create React frontend with basic UI
- Implement file upload functionality
- Set up PostgreSQL database

### Phase 2: Processing Engine (Weeks 3-4)
- Develop Go processing service
- Implement basic video conversion
- Add Redis job queuing
- Create worker pool architecture

### Phase 3: Real-time Features (Weeks 5-6)
- Implement WebSocket communication
- Add progress tracking
- Create notification system
- Build monitoring dashboard

### Phase 4: Advanced Features (Weeks 7-8)
- Add batch processing
- Implement retry mechanisms
- Create admin panel
- Add comprehensive testing

### Phase 5: Production Ready (Weeks 9-10)
- Docker containerization
- CI/CD pipeline setup
- Performance optimization
- Security hardening
- Documentation completion

This architecture provides a solid foundation for a production-ready video processing system that demonstrates advanced software engineering principles and distributed systems knowledge.