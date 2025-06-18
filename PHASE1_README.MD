### Phase 1 Development Order:

1. **Setup project structure** (Day 1)
2. **Database setup** with basic tables (Day 1-2)
3. **Go service** - basic file processing (Day 2-4)
4. **Node.js API** - upload endpoints (Day 4-6)
5. **React frontend** - basic UI (Day 6-8)
6. **Docker setup** (Day 11-12)

This structure scales perfectly from Phase 1 through Phase 5. Each service is independent, well-organized, and easy to extend. The separation of concerns makes it easy to work on different parts simultaneously and deploy them independently.

<!-- routes -->

Job Management
GET /api/jobs/:id - Get specific job details with queue info
GET /api/jobs - Get user's jobs (paginated, filtered)
POST /api/jobs/:id/retry - Retry failed jobs
POST /api/jobs/:id/cancel - Cancel pending/processing jobs
DELETE /api/jobs/:id - Delete job and clean up files
GET /api/jobs/stats - Get user's job statistics dashboard
GET /api/jobs/queue/status - Get current queue status

Query Parameters for GET /api/jobs

page - Page number (default: 1)
limit - Items per page (default: 10, max: 50)
status - Filter by status (pending, processing, completed, failed)
startDate - Filter jobs created after this date
endDate - Filter jobs created before this date
search - Search in file names
