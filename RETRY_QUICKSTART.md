# Retry Logic - Quick Start Guide

This guide will help you quickly set up and use the retry logic for your notification service.

## 🚀 Quick Setup (5 minutes)

### Step 1: Update Environment Variables

Add these to your `.env` file:

```bash
# Retry Configuration
MAX_RETRIES=3
RETRY_DELAY_MS=60000
USE_EXPONENTIAL_BACKOFF=true
```

### Step 2: Apply Database Migration

```bash
# Connect to your database
psql -h localhost -U your_db_user -d notifications_db

# Run the migration
\i migrations/add-next-retry-at.sql
```

**OR** if using Docker:

```bash
docker exec -i notification-postgres-dev psql -U your_db_user -d notifications_db < migrations/add-next-retry-at.sql
```

### Step 3: Restart the Service

```bash
docker-compose -f docker-compose.dev.yml restart backend
```

### Step 4: Verify Configuration

Check the logs to confirm retry configuration is loaded:

```bash
docker logs notification-nestjs-dev 2>&1 | grep "Retry configuration"
```

Expected output:

```
Retry configuration: maxRetries=3, retryDelayMs=60000, exponentialBackoff=true
```

## ✅ That's it! Service-side retry is now configured.

---

## 🔌 Client-Side Setup (Optional but Recommended)

### For TypeScript/Node.js Apps

1. **Copy the client library to your main app:**

```bash
cp notifications/client-examples/notification-client-with-retry.ts your-app/src/lib/
```

2. **Install dependencies (if not already installed):**

```bash
npm install axios
```

3. **Use in your code:**

```typescript
import { NotificationClientWithRetry } from './lib/notification-client-with-retry';

const client = new NotificationClientWithRetry(
  process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3000',
  process.env.NOTIFICATION_SERVICE_USER || 'admin',
  process.env.NOTIFICATION_SERVICE_PASS || 'password',
  { maxRetries: 3, initialDelayMs: 1000, exponentialBackoff: true },
);

// Use it
await client.sendEmail('user@example.com', 'Welcome', 'Hello!');
```

### For Python Apps

1. **Copy the client library:**

```bash
cp notifications/client-examples/notification_client_retry.py your-app/lib/
```

2. **Install dependencies:**

```bash
pip install requests
```

3. **Use in your code:**

```python
from lib.notification_client_retry import NotificationClientWithRetry, RetryConfig

client = NotificationClientWithRetry(
    base_url=os.getenv('NOTIFICATION_SERVICE_URL', 'http://localhost:3000'),
    username=os.getenv('NOTIFICATION_SERVICE_USER', 'admin'),
    password=os.getenv('NOTIFICATION_SERVICE_PASS', 'password'),
    retry_config=RetryConfig(max_retries=3, initial_delay_ms=1000)
)

# Use it
client.send_email('user@example.com', 'Welcome', 'Hello!')
```

---

## 🧪 Test It

### Test Service Retry

Send a notification to an invalid email to trigger retries:

```bash
curl -X POST http://localhost:3000/notifications \
  -u "admin:password" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "email",
    "recipient": "invalid@nonexistent-domain-99999.com",
    "subject": "Test Retry",
    "message": "This will fail and retry"
  }'
```

Watch the logs:

```bash
docker logs -f notification-nestjs-dev
```

You should see retry attempts logged.

---

## 📊 Monitor Retries

### Check notifications with retries:

```bash
curl http://localhost:3000/notifications \
  -u "admin:password" | jq '.[] | select(.retryCount > 0)'
```

### Check failed notifications:

```bash
curl http://localhost:3000/notifications \
  -u "admin:password" | jq '.[] | select(.status == "failed")'
```

---

## 🎛️ Adjust Configuration

### Want faster retries in development?

```bash
MAX_RETRIES=2
RETRY_DELAY_MS=10000  # 10 seconds
```

### Want more retries in production?

```bash
MAX_RETRIES=5
RETRY_DELAY_MS=120000  # 2 minutes
```

### Want linear backoff instead of exponential?

```bash
USE_EXPONENTIAL_BACKOFF=false
```

---

## 📚 Need More Details?

- **Full documentation:** See [RETRY_CONFIGURATION.md](./RETRY_CONFIGURATION.md)
- **Client examples:** See [client-examples/](./client-examples/) directory
- **Troubleshooting:** See "Troubleshooting" section in RETRY_CONFIGURATION.md

---

## 🆘 Common Issues

**Q: Notifications not retrying?**

- Check that the migration was applied (look for `nextRetryAt` column)
- Check logs for "Retry configuration" message
- Verify cron job is running: `docker logs notification-nestjs-dev | grep "Processing notification queue"`

**Q: Too many retries?**

- Reduce `MAX_RETRIES` in your `.env`
- Increase `RETRY_DELAY_MS` to space out retries more

**Q: Retries too slow?**

- Decrease `RETRY_DELAY_MS` in your `.env`
- Consider using `USE_EXPONENTIAL_BACKOFF=false` for constant delay

---

## 💡 Pro Tips

1. ✅ Start with defaults (3 retries, 1 minute delay, exponential backoff)
2. ✅ Monitor retry rates to tune configuration
3. ✅ Use client-side retries for network resilience
4. ✅ Set up alerts for high failure rates
5. ✅ Check failed notifications regularly for patterns

---

**Ready to learn more?** Read the full [RETRY_CONFIGURATION.md](./RETRY_CONFIGURATION.md) guide!
