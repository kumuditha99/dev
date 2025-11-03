# Retry Configuration Guide

This document explains how to configure retry logic for the notification microservice, both on the service side and client side.

## 📋 Table of Contents

- [Service-Side Retry Logic](#service-side-retry-logic)
- [Client-Side Retry Logic](#client-side-retry-logic)
- [Environment Variables](#environment-variables)
- [Database Migration](#database-migration)
- [How It Works](#how-it-works)
- [Testing Retry Logic](#testing-retry-logic)

---

## 🔄 Service-Side Retry Logic

The notification service automatically retries failed notifications with configurable exponential backoff.

### Features

✅ **Configurable max retries** (default: 3)  
✅ **Exponential backoff** with configurable delay  
✅ **Linear backoff** option  
✅ **Automatic retry scheduling** via cron job  
✅ **Detailed logging** of retry attempts  
✅ **Failed notification tracking** after max retries

### How It Works

1. **Notification Queued**: When a notification is created, it's saved with `status: PENDING`
2. **Cron Job Processing**: Every 30 seconds, the queue processor picks up pending notifications
3. **Send Attempt**: The service attempts to send the notification
4. **On Failure**:
   - Increment `retryCount`
   - Calculate `nextRetryAt` using exponential backoff
   - Set status back to `PENDING` (if retries remain) or `FAILED` (if max retries exceeded)
5. **Retry**: The cron job will pick it up again when `nextRetryAt` is reached

### Retry Timeline Example

With default settings (`MAX_RETRIES=3`, `RETRY_DELAY_MS=60000`, exponential backoff):

```
Attempt 1: Immediate (0:00)
   ↓ FAILS
Attempt 2: +1 minute (1:00)
   ↓ FAILS
Attempt 3: +2 minutes (3:00)
   ↓ FAILS
Attempt 4: +4 minutes (7:00)
   ↓ FAILS → Marked as FAILED
```

---

## 🌐 Client-Side Retry Logic

For transient network issues between your main app and the notification service, implement client-side retries.

### Why Client-Side Retries?

- **Network failures**: Connection refused, DNS errors
- **Timeouts**: Service temporarily unavailable
- **Rate limiting**: 429 Too Many Requests
- **Server errors**: 500, 502, 503, 504

### Implementation

We provide ready-to-use client libraries with retry logic:

**TypeScript/Node.js:**

```typescript
import { NotificationClientWithRetry } from './notification-client-with-retry';

const client = new NotificationClientWithRetry(
  'http://notification-service:3000',
  'username',
  'password',
  {
    maxRetries: 3,
    initialDelayMs: 1000, // Start with 1 second
    exponentialBackoff: true,
  },
);

// Automatically retries on failure
await client.sendEmail('user@example.com', 'Welcome', 'Hello!');
```

**Python:**

```python
from notification_client_retry import NotificationClientWithRetry, RetryConfig

client = NotificationClientWithRetry(
    base_url='http://notification-service:3000',
    username='username',
    password='password',
    retry_config=RetryConfig(
        max_retries=3,
        initial_delay_ms=1000,
        exponential_backoff=True
    )
)

# Automatically retries on failure
client.send_email(
    recipient='user@example.com',
    subject='Welcome',
    message='Hello!'
)
```

See `client-examples/` directory for full implementation.

---

## ⚙️ Environment Variables

### Service-Side Configuration

Add these to your `.env` file or Docker environment:

```bash
# Maximum number of retry attempts (default: 3)
MAX_RETRIES=3

# Base delay between retries in milliseconds (default: 60000 = 1 minute)
RETRY_DELAY_MS=60000

# Use exponential backoff (true) or linear backoff (false)
# Exponential: delay * 2^retryCount
# Linear: constant delay
USE_EXPONENTIAL_BACKOFF=true
```

### Client-Side Configuration

For your main application:

```bash
# Notification service connection
NOTIFICATION_SERVICE_URL=http://notification-service:3000
NOTIFICATION_SERVICE_USER=admin
NOTIFICATION_SERVICE_PASS=secure_password

# Client retry configuration (optional)
NOTIFICATION_RETRY_COUNT=3
NOTIFICATION_RETRY_DELAY=1000
```

---

## 🗄️ Database Migration

The notification entity now includes a `nextRetryAt` field for tracking retry schedules.

### Generate Migration

```bash
# If using TypeORM migrations
npm run typeorm migration:generate -- -n AddNextRetryAt

# Or let TypeORM auto-sync (development only)
# Set synchronize: true in typeorm.config.ts
```

### Manual Migration (PostgreSQL)

```sql
ALTER TABLE notifications
ADD COLUMN "nextRetryAt" TIMESTAMP NULL;

-- Optional: Add index for faster queue processing
CREATE INDEX idx_notifications_retry
ON notifications(status, "nextRetryAt")
WHERE status = 'pending';
```

### Apply Migration

```bash
npm run typeorm migration:run
```

---

## 🎯 How It Works

### Service-Side Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Main App → POST /notifications                          │
│    (Queue notification)                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Notification Saved                                       │
│    status: PENDING                                          │
│    retryCount: 0                                            │
│    nextRetryAt: null                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Cron Job (every 30s)                                     │
│    - Find PENDING notifications                             │
│    - Filter where nextRetryAt <= now                        │
│    - Process notifications                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
              ┌───────────┴───────────┐
              │                       │
          ✅ SUCCESS              ❌ FAILURE
              │                       │
              ↓                       ↓
┌─────────────────────────┐  ┌──────────────────────────────┐
│ status: SENT            │  │ retryCount++                 │
│ sentAt: now             │  │ errorMessage: "..."          │
└─────────────────────────┘  │                              │
                             │ if (retryCount >= maxRetries)│
                             │   status: FAILED             │
                             │ else                         │
                             │   status: PENDING            │
                             │   nextRetryAt: now + delay   │
                             └──────────────────────────────┘
                                          ↓
                             ┌────────────────────────────────┐
                             │ Wait until nextRetryAt         │
                             │ Then retry from step 3         │
                             └────────────────────────────────┘
```

### Exponential Backoff Calculation

```typescript
// For retry attempt N (0-based):
const delay = RETRY_DELAY_MS * Math.pow(2, N);

// Examples with RETRY_DELAY_MS=60000 (1 minute):
// Attempt 0 (first retry):  60000ms = 1 minute
// Attempt 1 (second retry): 120000ms = 2 minutes
// Attempt 2 (third retry):  240000ms = 4 minutes
```

---

## 🧪 Testing Retry Logic

### 1. Test Service-Side Retries

```bash
# Start the service
docker-compose -f docker-compose.dev.yml up

# Send a test notification to a non-existent email
curl -X POST http://localhost:3000/notifications \
  -u "admin:password" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "email",
    "recipient": "invalid@nonexistent-domain-12345.com",
    "subject": "Test",
    "message": "Test retry logic"
  }'

# Watch the logs
docker logs -f notification-nestjs-dev

# You should see retry attempts every 1, 2, 4 minutes
```

### 2. Test Client-Side Retries

**Simulate Service Unavailable:**

```bash
# Stop the notification service
docker-compose -f docker-compose.dev.yml stop backend

# Run your main app with the client
# It should retry and eventually fail with connection error
```

**Simulate Rate Limiting:**

Create a test endpoint that returns 429:

```typescript
// In your test file
const mockServer = nock('http://localhost:3000')
  .post('/notifications')
  .reply(429, { message: 'Too Many Requests' })
  .post('/notifications')
  .reply(429, { message: 'Too Many Requests' })
  .post('/notifications')
  .reply(201, { ok: true, id: 'test-id', status: 'pending' });

// Client should retry and succeed on 3rd attempt
```

### 3. Verify Retry Configuration

Check that environment variables are loaded correctly:

```bash
# Check service logs on startup
docker logs notification-nestjs-dev 2>&1 | grep "Retry configuration"

# Expected output:
# Retry configuration: maxRetries=3, retryDelayMs=60000, exponentialBackoff=true
```

### 4. Monitor Retry Attempts

```bash
# Query notifications with retries
curl -X GET http://localhost:3000/notifications \
  -u "admin:password" | jq '.[] | select(.retryCount > 0)'

# Check failed notifications
curl -X GET http://localhost:3000/notifications \
  -u "admin:password" | jq '.[] | select(.status == "failed")'
```

---

## 📊 Monitoring & Observability

### Recommended Metrics

Track these metrics in your monitoring system:

- `notification_retry_count`: Distribution of retry attempts
- `notification_failure_rate`: Percentage of notifications that fail after max retries
- `notification_retry_delay`: Average time between retries
- `notification_success_after_retry`: Count of successful retries

### Logging

The service logs retry attempts with context:

```
[NotificationsService] Notification 123 will retry at 2025-11-03T10:15:00Z (attempt 2/3)
[NotificationsService] Notification 456 failed after 3 attempts
```

---

## 🎛️ Configuration Recommendations

### Development

```bash
MAX_RETRIES=2
RETRY_DELAY_MS=30000        # 30 seconds
USE_EXPONENTIAL_BACKOFF=true
```

### Production

```bash
MAX_RETRIES=3
RETRY_DELAY_MS=60000        # 1 minute
USE_EXPONENTIAL_BACKOFF=true
```

### High-Volume Production

```bash
MAX_RETRIES=5
RETRY_DELAY_MS=120000       # 2 minutes
USE_EXPONENTIAL_BACKOFF=true
```

---

## 🔍 Troubleshooting

### Problem: Notifications stuck in PENDING

**Cause**: `nextRetryAt` is in the future

**Solution**: Wait for the scheduled retry time or manually reset:

```sql
UPDATE notifications
SET "nextRetryAt" = NOW()
WHERE status = 'pending' AND "retryCount" > 0;
```

### Problem: Too many retries overwhelming system

**Cause**: `RETRY_DELAY_MS` too short or `MAX_RETRIES` too high

**Solution**: Increase delay or reduce max retries:

```bash
MAX_RETRIES=2
RETRY_DELAY_MS=300000  # 5 minutes
```

### Problem: No retries happening

**Check**:

1. Cron job is running: `docker logs notification-nestjs-dev | grep "Processing notification queue"`
2. Environment variables loaded: Look for "Retry configuration" log
3. Database has `nextRetryAt` column
4. Notifications have `status='pending'`

---

## 📚 Additional Resources

- [Client Examples](./client-examples/) - Ready-to-use client libraries
- [TypeORM Migrations](https://typeorm.io/migrations) - Database migration docs
- [NestJS Schedule](https://docs.nestjs.com/techniques/task-scheduling) - Cron job docs

---

## 💡 Best Practices

1. ✅ **Use exponential backoff** to avoid overwhelming failing services
2. ✅ **Set reasonable max retries** (3-5 is usually sufficient)
3. ✅ **Monitor retry metrics** to identify systemic issues
4. ✅ **Implement dead letter queue** for failed notifications
5. ✅ **Alert on high failure rates** to catch issues early
6. ✅ **Use client-side retries** for network resilience
7. ✅ **Keep retry delays proportional** to notification urgency
