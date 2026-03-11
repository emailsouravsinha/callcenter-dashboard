# AI Call Answering System - SaaS Multi-Tenant Version

## Overview
This Python application responds to missed calls using ChatGPT with FAISS vector database, now supporting multiple organizations with complete data isolation.

## Key Changes from Original

### 1. **Multi-Tenant Support**
- Uses `organizations` table instead of single customer
- All data isolated by `organization_id`
- Maps Twilio phone numbers to organizations

### 2. **New Database Tables Used**
- `organizations` - Your SaaS customers
- `contacts` - Customer profiles (replaces user_profiles)
- `calls` - Full call records with transcripts
- `doc_mappings` - Links organizations to FAISS documents
- `appointments` - Scheduled meetings
- `usage_metrics` - Track API usage for billing

### 3. **Enhanced Features**
- Automatic contact creation/update
- Full call logging with AI summaries
- Sentiment analysis stored in database
- Usage tracking for billing limits
- Audit logging for security

## Installation

```bash
# Install dependencies
pip install fastapi uvicorn twilio langchain-community langchain-openai python-dotenv openai mysql-connector-python pytz httpx

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials
```

## Environment Variables

```env
# OpenAI
OPENAI_API_KEY=your-openai-api-key

# MySQL Database (SaaS Multi-Tenant)
MYSQL_HOST=your-database-host
MYSQL_USER=your-database-user
MYSQL_PASSWORD=your-database-password
MYSQL_DATABASE=callcenter_saas

# Calendar API
CALENDAR_API_BASE_URL=https://your-calendar-api.com
```

## Database Setup

Run the SaaS database setup script first:
```bash
mysql -h YOUR_HOST -u YOUR_USER -p < ../database-saas-setup.sql
```

## Running the Application

```bash
# Development
uvicorn main:app --reload --port 8000

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

- `POST /voice` - Main Twilio webhook endpoint
- `GET /health` - Health check
- `GET /` - Root endpoint

## How It Works

### Call Flow
1. **Incoming Call** → Twilio sends to `/voice`
2. **Organization Lookup** → Maps Twilio number to organization
3. **Contact Check** → Finds or creates contact record
4. **AI Processing** → Uses FAISS + ChatGPT for responses
5. **Call Logging** → Stores full transcript in `calls` table
6. **Usage Tracking** → Updates metrics for billing

### Multi-Tenant Security
- Every query filters by `organization_id`
- Contacts belong to specific organizations
- FAISS documents mapped per organization
- Complete data isolation

## Testing

```bash
# Test database connection
curl http://localhost:8000/health

# Test with Twilio CLI
twilio phone-numbers:update +1234567890 --voice-url=http://your-server.com/voice
```

## Deployment

### Using Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Using PM2
```bash
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name ai-caller
pm2 save
```

## Monitoring

Check logs:
```bash
# Application logs
tail -f logs/app.log

# Database queries
SELECT * FROM calls WHERE organization_id = 1 ORDER BY created_at DESC LIMIT 10;

# Usage metrics
SELECT * FROM usage_metrics WHERE organization_id = 1;
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MySQL credentials in `.env`
   - Verify database exists: `SHOW DATABASES;`
   - Check firewall allows port 3306

2. **FAISS Not Loading**
   - Ensure `vectorstore_multi_prod` directory exists
   - Check `index.faiss` file is present
   - Verify OpenAI API key is set

3. **Twilio Not Connecting**
   - Check webhook URL is publicly accessible
   - Verify `/voice` endpoint returns TwiML
   - Check Twilio phone number configuration

## Next Steps

1. Add authentication for API endpoints
2. Implement rate limiting per organization
3. Add WebSocket for real-time updates
4. Create admin panel for managing organizations
5. Add Stripe integration for billing

## Support

For issues or questions, check the logs and database tables for debugging information.
