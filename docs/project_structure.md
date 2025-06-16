# Complete Project Structure - Video Processing Platform

## 📁 Root Project Structure

```
video-processing-platform/
├── README.md
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── .gitignore
├── docs/
│   ├── api-docs.md
│   ├── deployment.md
│   └── development-setup.md
├── scripts/
│   ├── setup.sh
│   ├── deploy.sh
│   └── cleanup.sh
├── frontend/                 # React Application
├── api-gateway/             # Node.js API Service
├── processing-service/      # Go Processing Service
└── shared/
    ├── database/
    │   ├── migrations/
    │   └── seeds/
    └── configs/
        ├── nginx.conf
        └── redis.conf
```

---

## 🎨 Frontend Structure (React)

```
frontend/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Button.module.css
│   │   │   │   └── index.js
│   │   │   ├── Modal/
│   │   │   ├── Loader/
│   │   │   ├── Header/
│   │   │   └── Layout/
│   │   ├── auth/
│   │   │   ├── LoginForm/
│   │   │   ├── RegisterForm/
│   │   │   └── ProtectedRoute/
│   │   ├── upload/
│   │   │   ├── FileUpload/
│   │   │   ├── UploadProgress/
│   │   │   └── DropZone/
│   │   ├── video/
│   │   │   ├── VideoPlayer/
│   │   │   ├── VideoCard/
│   │   │   ├── VideoList/
│   │   │   └── ProcessingOptions/
│   │   └── dashboard/
│   │       ├── JobsList/
│   │       ├── StatsCard/
│   │       └── RecentActivity/
│   ├── pages/
│   │   ├── Home/
│   │   │   ├── Home.jsx
│   │   │   ├── Home.module.css
│   │   │   └── index.js
│   │   ├── Login/
│   │   ├── Register/
│   │   ├── Dashboard/
│   │   ├── Upload/
│   │   ├── VideoLibrary/
│   │   └── Profile/
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useWebSocket.js
│   │   ├── useUpload.js
│   │   └── useApi.js
│   ├── services/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── websocket.js
│   │   └── upload.js
│   ├── context/
│   │   ├── AuthContext.js
│   │   ├── UploadContext.js
│   │   └── NotificationContext.js
│   ├── utils/
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   ├── formatters.js
│   │   └── validators.js
│   ├── styles/
│   │   ├── globals.css
│   │   ├── variables.css
│   │   └── components.css
│   ├── App.js
│   ├── App.css
│   └── index.js
├── package.json
├── package-lock.json
├── .env.local
├── .env.example
└── .gitignore
```

---

## 🌐 Node.js API Gateway Structure

```
api-gateway/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── upload.controller.js
│   │   ├── job.controller.js
│   │   └── admin.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── upload.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── error.middleware.js
│   │   └── rateLimiter.middleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Job.js
│   │   ├── File.js
│   │   └── index.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── upload.routes.js
│   │   ├── job.routes.js
│   │   ├── admin.routes.js
│   │   └── index.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── upload.service.js
│   │   ├── job.service.js
│   │   ├── email.service.js
│   │   ├── processing.service.js  # Communicates with Go service
│   │   └── websocket.service.js
│   ├── config/
│   │   ├── database.js
│   │   ├── redis.js
│   │   ├── aws.js
│   │   ├── email.js
│   │   └── index.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── helpers.js
│   │   ├── validators.js
│   │   ├── constants.js
│   │   └── errors.js
│   ├── websocket/
│   │   ├── handlers/
│   │   │   ├── job.handler.js
│   │   │   └── notification.handler.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js
│   │   └── index.js
│   ├── tests/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── helpers/
│   │       ├── setup.js
│   │       └── teardown.js
│   └── app.js
├── uploads/          # Temporary upload storage
├── logs/
├── package.json
├── package-lock.json
├── .env
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
└── server.js
```

---

## 🚀 Go Processing Service Structure

```
processing-service/
├── cmd/
│   ├── server/
│   │   └── main.go
│   └── worker/
│       └── main.go
├── internal/
│   ├── api/
│   │   ├── handlers/
│   │   │   ├── job.go
│   │   │   ├── health.go
│   │   │   ├── metrics.go
│   │   │   └── admin.go
│   │   ├── middleware/
│   │   │   ├── auth.go
│   │   │   ├── logging.go
│   │   │   ├── cors.go
│   │   │   └── recovery.go
│   │   ├── routes/
│   │   │   └── routes.go
│   │   └── server.go
│   ├── models/
│   │   ├── job.go
│   │   ├── file.go
│   │   ├── user.go
│   │   └── config.go
│   ├── services/
│   │   ├── job.service.go
│   │   ├── file.service.go
│   │   ├── processing.service.go
│   │   ├── storage.service.go
│   │   ├── queue.service.go
│   │   └── notification.service.go
│   ├── workers/
│   │   ├── video.worker.go
│   │   ├── audio.worker.go
│   │   ├── thumbnail.worker.go
│   │   └── manager.go
│   ├── processors/
│   │   ├── ffmpeg/
│   │   │   ├── converter.go
│   │   │   ├── analyzer.go
│   │   │   └── utils.go
│   │   ├── thumbnail/
│   │   │   └── generator.go
│   │   └── watermark/
│   │       └── overlay.go
│   ├── storage/
│   │   ├── local/
│   │   │   └── storage.go
│   │   ├── s3/
│   │   │   └── storage.go
│   │   └── interface.go
│   ├── queue/
│   │   ├── redis/
│   │   │   └── queue.go
│   │   ├── memory/
│   │   │   └── queue.go
│   │   └── interface.go
│   ├── database/
│   │   ├── postgres/
│   │   │   ├── connection.go
│   │   │   └── migrations/
│   │   └── interface.go
│   ├── config/
│   │   ├── config.go
│   │   └── validation.go
│   └── utils/
│       ├── logger.go
│       ├── helpers.go
│       ├── errors.go
│       └── constants.go
├── pkg/
│   ├── metrics/
│   │   └── prometheus.go
│   ├── auth/
│   │   └── jwt.go
│   └── response/
│       └── response.go
├── tests/
│   ├── integration/
│   ├── unit/
│   └── helpers/
├── scripts/
│   ├── build.sh
│   ├── test.sh
│   └── migrate.sh
├── storage/
│   ├── uploads/
│   ├── processed/
│   └── temp/
├── logs/
├── go.mod
├── go.sum
├── .env
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── Makefile
```

---

## 🐳 Docker Configuration

### Root docker-compose.yml

```yaml
version: "3.8"
services:
    postgres:
        image: postgres:15
        environment:
            POSTGRES_DB: video_platform
            POSTGRES_USER: admin
            POSTGRES_PASSWORD: password
        volumes:
            - postgres_data:/var/lib/postgresql/data
            - ./shared/database/migrations:/docker-entrypoint-initdb.d
        ports:
            - "5432:5432"

    redis:
        image: redis:7-alpine
        ports:
            - "6379:6379"
        volumes:
            - redis_data:/data

    api-gateway:
        build: ./api-gateway
        ports:
            - "3001:3001"
        depends_on:
            - postgres
            - redis
        environment:
            - NODE_ENV=development
        volumes:
            - ./api-gateway:/app
            - /app/node_modules

    processing-service:
        build: ./processing-service
        ports:
            - "8080:8080"
        depends_on:
            - postgres
            - redis
        environment:
            - GO_ENV=development
        volumes:
            - ./processing-service:/app
            - ./storage:/storage

    frontend:
        build: ./frontend
        ports:
            - "3000:3000"
        depends_on:
            - api-gateway
        volumes:
            - ./frontend:/app
            - /app/node_modules

volumes:
    postgres_data:
    redis_data:
```

---

## 📋 Configuration Files

### Root .env.example

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=video_platform
DB_USER=admin
DB_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRY=24h

# Services
API_GATEWAY_URL=http://localhost:3001
PROCESSING_SERVICE_URL=http://localhost:8080
FRONTEND_URL=http://localhost:3000

# Storage
STORAGE_TYPE=local  # local, s3
UPLOAD_DIR=./storage/uploads
PROCESSED_DIR=./storage/processed

# External Services
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_BUCKET_NAME=

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=
EMAIL_PASSWORD=
```

---

## 🚀 Getting Started Scripts

### Root setup.sh

```bash
#!/bin/bash
echo "Setting up Video Processing Platform..."

# Copy environment files
cp .env.example .env
cp frontend/.env.example frontend/.env.local
cp api-gateway/.env.example api-gateway/.env
cp processing-service/.env.example processing-service/.env

# Install dependencies
echo "Installing Node.js dependencies..."
cd api-gateway && npm install && cd ..
cd frontend && npm install && cd ..

# Build Go service
echo "Building Go service..."
cd processing-service && go mod tidy && go build -o main cmd/server/main.go && cd ..

# Create storage directories
mkdir -p storage/{uploads,processed,temp}

# Start services
echo "Starting services with Docker Compose..."
docker-compose up -d postgres redis

echo "Setup complete! Run 'npm run dev' to start development servers."
```

## 📝 Development Workflow

### Phase 1 Development Order:

1. **Setup project structure** (Day 1)
2. **Database setup** with basic tables (Day 1-2)
3. **Go service** - basic file processing (Day 2-4)
4. **Node.js API** - upload endpoints (Day 4-6)
5. **React frontend** - basic UI (Day 6-8)
6. **Docker setup** (Day 11-12)

This structure scales perfectly from Phase 1 through Phase 5. Each service is independent, well-organized, and easy to extend. The separation of concerns makes it easy to work on different parts simultaneously and deploy them independently.
