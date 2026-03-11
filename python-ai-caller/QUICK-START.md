# Quick Start Guide - Multi-Tenant AI Caller

## What You Have Now

Your Python AI caller has been completely converted to support SaaS multi-tenancy with full data isolation. Here's what's ready:

### ✅ Complete Application Files
- `main.py` - FastAPI application with Twilio webhook
- `database.py` - All database functions with multi-tenant support
- `ai_helpers.py` - LLM interactions (RAG, sentiment, intent)
- `calendar_api.py` - Appointment scheduling integration
- `config.py` - Environment configuration
- `requirements.txt` - Python dependencies
- `.env.example` - Environment variable template

### ✅ Documentation
- `README.md` - Complete usage guide
- `MIGRATION-GUIDE.md` - Detailed conversion instructions
- `QUICK-START.md` - This file

---

## Installation (5 Minutes)

### 1. Install Python Dependencies
```bash
cd dashboard-project/python-ai-caller
pip install -r requirements.txt
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env
# Edit .env with your credentials
```

Required variables:
- `OPENAI_API_KEY` - Your OpenAI API key
- `MYSQL_HOST` - Your AWS Lightsail database host
- `MYSQL_USER` - Database username
- `MYSQL_PASSWORD` - Database password
- `MYSQL_DATABASE` - Database name (callcenter_saas)
- `CALENDAR_API_BASE_URL` - Your calendar API endpoint

### 3. Set Up Database
```bash
# Run the SaaS database setup script
mysql -h YOUR_HOST -u YOUR_USER -p < ../database-saas-setup.sql
```

This creates:
- 13 tables with complete multi-tenant structure
- 2 sample organizations (Acme Corporation, TechStart Inc)
- Sample data for testing

### 4. Prepare FAISS Vector Store
```bash
# Ensure your FAISS index is in the correct location
# Default path: vectorstore_multi_prod/
# Must contain: index.faiss and index.pkl
```

### 5. Run the Application
```bash
# Development mode
uvicorn main:app --reload --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## Testing (2 Minutes)

### 1. Health Check
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "OK",
  "service": "AI Call Answering System - Multi-Tenant",
  "faiss_loaded": true,
  "openai_client_initialized": true,
  "database": "MySQL SaaS Multi-Tenant"
}
```

### 2. Test Organization Lookup
```python
# In Python console
from database import get_organization_from_phone

# Test with sample data
org_id, doc_id, org_name = get_organization_from_phone("+15551234567")
print(f"Org: {org_name}, ID: {org_id}, Doc: {doc_id}")
# Expected: Org: Acme Corporation, ID: 1, Doc: acme_corp_v1
```

### 3. Configure Twilio Webhook
```bash
# Point your Twilio number to your server
# Webhook URL: https://your-server.com/voice
# Method: POST
```

---

## Key Features

### 🏢 Multi-Tenant Support
- Each organization has complete data isolation
- Twilio phone numbers map to organizations
- All queries filter by `organization_id`

### 📞 Call Handling
- Automatic contact creation/update
- Full call transcription logging
- AI-powered responses using FAISS + ChatGPT
- Conversation history for context

### 🤖 AI Analysis
- Sentiment analysis (positive/neutral/negative)
- Intent detection (what the caller wants)
- AI-generated call summaries
- RAG with organization-specific documents

### 📅 Appointment Scheduling
- Schedule, cancel, reschedule meetings
- Integration with external calendar API
- Database records for all appointments
- Automatic usage tracking

### 💰 Usage Tracking
- Track calls, API requests, storage
- Per-organization metrics
- Ready for billing integration
- Daily aggregation

---

## Database Structure

### Core SaaS Tables
- `organizations` - Your customers (13 columns)
- `subscription_plans` - Pricing tiers (9 columns)
- `subscriptions` - Active subscriptions (11 columns)
- `invoices` - Billing history (10 columns)
- `organization_users` - User access (8 columns)
- `usage_metrics` - Usage tracking (7 columns)

### Call Center Tables
- `calls` - Call records with transcripts (18 columns)
- `contacts` - Customer profiles (13 columns)
- `appointments` - Scheduled meetings (11 columns)
- `leads` - Lead tracking (12 columns)
- `surveys` - CSAT/NPS feedback (9 columns)
- `audit_logs` - Security tracking (8 columns)

### Configuration
- `doc_mappings` - Phone → Organization mapping (8 columns)

---

## How It Works

### Call Flow
```
1. Incoming Call → Twilio sends to /voice endpoint
2. Organization Lookup → Maps Twilio number to organization
3. Contact Management → Finds or creates contact record
4. AI Processing → Uses FAISS + ChatGPT for responses
5. Call Logging → Stores full transcript with AI analysis
6. Usage Tracking → Updates metrics for billing
```

### Multi-Tenant Security
```python
# Every database query includes organization_id
SELECT * FROM calls WHERE organization_id = %s AND status = 'answered'

# Contacts are organization-specific
SELECT * FROM contacts WHERE organization_id = %s AND phone = %s

# FAISS documents filtered by doc_id
docs = [d for d in docs if d.metadata.get("doc_id") == doc_id]
```

---

## Next Steps

### 1. Connect to Your Database
Update `.env` with your AWS Lightsail MySQL credentials:
```env
MYSQL_HOST=ls-abc123.czowadgeezqi.us-east-1.rds.amazonaws.com
MYSQL_USER=dbmasteruser
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=callcenter_saas
```

### 2. Add Your Organizations
```sql
-- Add your real organizations
INSERT INTO organizations (name, domain, phone, status, subscription_tier)
VALUES ('Your Company', 'yourcompany.com', '+15551234567', 'active', 'professional');

-- Map Twilio number to organization
INSERT INTO doc_mappings (organization_id, phone_number, vector_store_id, is_active)
VALUES (1, '+15551234567', 'your_doc_id', TRUE);
```

### 3. Prepare FAISS Documents
Ensure your FAISS vector store includes `doc_id` in metadata:
```python
# When creating FAISS documents
metadata = {
    "doc_id": "your_doc_id",  # Must match doc_mappings.vector_store_id
    "source": "company_docs.pdf",
    "page": 1
}
```

### 4. Configure Twilio
- Point webhook to your server: `https://your-server.com/voice`
- Set method to POST
- Enable speech recognition

### 5. Test with Real Calls
- Call your Twilio number
- Check logs: `tail -f logs/app.log`
- Verify database records: `SELECT * FROM calls ORDER BY created_at DESC LIMIT 5;`

---

## Troubleshooting

### Database Connection Failed
```bash
# Test connection
mysql -h YOUR_HOST -u YOUR_USER -p

# Check firewall allows port 3306
# Verify credentials in .env
```

### FAISS Not Loading
```bash
# Check directory exists
ls -la vectorstore_multi_prod/

# Verify files present
# - index.faiss
# - index.pkl
```

### No Organization Found
```sql
-- Check doc_mappings
SELECT * FROM doc_mappings WHERE phone_number = '+15551234567';

-- Verify organization is active
SELECT * FROM organizations WHERE id = 1;
```

---

## Production Deployment

### Using Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t ai-caller .
docker run -p 8000:8000 --env-file .env ai-caller
```

### Using PM2
```bash
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name ai-caller
pm2 save
pm2 startup
```

---

## Support

Check these files for more details:
- `README.md` - Full documentation
- `MIGRATION-GUIDE.md` - Detailed conversion guide
- `../SAAS-ARCHITECTURE.md` - Database architecture
- `../SETUP-GUIDE.md` - Database setup instructions

Your multi-tenant AI caller is ready to handle calls for multiple organizations! 🚀
