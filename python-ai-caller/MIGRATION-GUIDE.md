# Migration Guide: Converting to SaaS Multi-Tenant Database

## Overview
This guide shows how to convert your existing Python AI caller to use the new SaaS multi-tenant database structure.

## Key Database Changes

### OLD → NEW Table Mappings

| Old Table | New Table | Key Changes |
|-----------|-----------|-------------|
| `doc_mappings` | `doc_mappings` | Added `organization_id` column |
| `user_profiles` | `contacts` | Now linked to organizations |
| `conversation_logs` | `calls` | Enhanced with more fields |
| N/A | `organizations` | NEW: Your SaaS customers |
| N/A | `usage_metrics` | NEW: Track usage for billing |

---

## Step-by-Step Migration

### 1. Update `doc_mappings` Table

**OLD Structure:**
```sql
CREATE TABLE doc_mappings (
    phone_number VARCHAR(50),
    doc_id VARCHAR(100),
    client_name VARCHAR(255)
);
```

**NEW Structure:**
```sql
CREATE TABLE doc_mappings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,  -- ADDED
    phone_number VARCHAR(50),
    document_name VARCHAR(255),
    faiss_index_path VARCHAR(500),
    vector_store_id VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
```

### 2. Update `get_mapping_from_db()` Function

**OLD Code:**
```python
def get_mapping_from_db(twilio_phone: str) -> Tuple[Optional[str], Optional[str]]:
    query = "SELECT doc_id, client_name FROM doc_mappings WHERE phone_number = %s"
    # Returns: doc_id, client_name
```

**NEW Code:**
```python
def get_mapping_from_db(twilio_phone: str) -> Tuple[Optional[int], Optional[str], Optional[str]]:
    """Returns: organization_id, doc_id, organization_name"""
    query = """
        SELECT dm.organization_id, dm.vector_store_id, o.name
        FROM doc_mappings dm
        INNER JOIN organizations o ON dm.organization_id = o.id
        WHERE dm.phone_number = %s AND dm.is_active = TRUE AND o.status = 'active'
        LIMIT 1
    """
    cursor.execute(query, (twilio_phone,))
    result = cursor.fetchone()
    if result:
        return result[0], result[1], result[2]  # org_id, doc_id, org_name
    return None, None, None
```

### 3. Replace `user_profiles` with `contacts`

**OLD Code:**
```python
def get_user_profile(caller_phone: str):
    query = "SELECT * FROM user_profiles WHERE caller_phone = %s"
```

**NEW Code:**
```python
def get_or_create_contact(caller_phone: str, organization_id: int):
    """Get existing contact or create new one for the organization"""
    query = """
        SELECT id, name, email, phone, status
        FROM contacts
        WHERE organization_id = %s AND phone = %s
        LIMIT 1
    """
    cursor.execute(query, (organization_id, caller_phone))
    result = cursor.fetchone()
    
    if not result:
        # Create new contact
        insert_query = """
            INSERT INTO contacts (organization_id, phone, status, first_contact_date)
            VALUES (%s, %s, 'active', NOW())
        """
        cursor.execute(insert_query, (organization_id, caller_phone))
        conn.commit()
        return cursor.lastrowid
    
    return result[0]  # contact_id
```

### 4. Update `log_conversation_turn()` to use `calls` table

**OLD Code:**
```python
def log_conversation_turn(caller_phone, doc_id, user_input, assistant_output):
    query = """
        INSERT INTO conversation_logs(timestamp, caller_phone, doc_id, user_input, assistant_output)
        VALUES (%s, %s, %s, %s, %s)
    """
```

**NEW Code:**
```python
def log_call(organization_id: int, contact_id: int, caller_phone: str, 
             transcript: str, ai_summary: str, sentiment: str, intent: str,
             outcome: str, duration: int):
    """Log complete call record with AI analysis"""
    query = """
        INSERT INTO calls (
            organization_id, caller_phone, caller_name, caller_email,
            start_time, end_time, duration, status, outcome,
            transcript, ai_summary, sentiment, intent,
            first_contact_resolution, created_at
        ) VALUES (
            %s, %s, 
            (SELECT name FROM contacts WHERE id = %s),
            (SELECT email FROM contacts WHERE id = %s),
            %s, NOW(), SEC_TO_TIME(%s), 'answered', %s,
            %s, %s, %s, %s,
            TRUE, NOW()
        )
    """
    cursor.execute(query, (
        organization_id, caller_phone, contact_id, contact_id,
        datetime.now() - timedelta(seconds=duration), duration, outcome,
        transcript, ai_summary, sentiment, intent
    ))
    conn.commit()
    return cursor.lastrowid
```

### 5. Add Usage Tracking

**NEW Function:**
```python
def track_usage(organization_id: int, metric_type: str, quantity: int = 1):
    """Track usage for billing (calls, API requests, etc.)"""
    today = datetime.now().date()
    
    query = """
        INSERT INTO usage_metrics (organization_id, metric_type, quantity, period_start, period_end)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE quantity = quantity + %s
    """
    cursor.execute(query, (
        organization_id, metric_type, quantity, today, today, quantity
    ))
    conn.commit()
```

### 6. Update Main Processing Function

**OLD Code:**
```python
async def process_user_turn(caller_input, twilio_phone, caller_phone):
    doc_id, client_name = get_mapping_from_db(twilio_phone)
    user_profile = get_user_profile(caller_phone)
    # ... process ...
```

**NEW Code:**
```python
async def process_user_turn(caller_input, twilio_phone, caller_phone):
    # 1. Get organization from Twilio number
    org_id, doc_id, org_name = get_mapping_from_db(twilio_phone)
    
    if not org_id:
        return "This phone number is not configured for any organization."
    
    # 2. Get or create contact for this organization
    contact_id = get_or_create_contact(caller_phone, org_id)
    
    # 3. Track usage for billing
    track_usage(org_id, 'calls', 1)
    
    # 4. Process with AI (existing logic)
    answer = get_ai_answer(caller_input, doc_id, db, openai_client, history)
    
    # 5. Analyze sentiment
    sentiment = analyze_sentiment(answer)  # 'positive', 'neutral', 'negative'
    
    # 6. Log complete call record
    log_call(
        organization_id=org_id,
        contact_id=contact_id,
        caller_phone=caller_phone,
        transcript=caller_input,
        ai_summary=answer[:500],
        sentiment=sentiment,
        intent=extract_intent(caller_input),
        outcome='info_only',  # or 'appointment_booked', etc.
        duration=30  # estimate or track actual
    )
    
    return answer
```

### 7. Add Sentiment Analysis

**NEW Function:**
```python
def analyze_sentiment(text: str, client: OpenAI) -> str:
    """Analyze sentiment of conversation"""
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Analyze sentiment. Respond with only: positive, neutral, or negative"},
                {"role": "user", "content": text}
            ],
            temperature=0.0
        )
        return response.choices[0].message.content.strip().lower()
    except:
        return "neutral"
```

### 8. Update Appointment Booking

**OLD Code:**
```python
await schedule_meeting_api(doc_id, title, start_time, attendee_email, caller_phone)
```

**NEW Code:**
```python
async def schedule_meeting_api(organization_id: int, contact_id: int, title: str, 
                               start_time: str, attendee_email: str, caller_phone: str):
    """Schedule meeting and create appointment record"""
    
    # 1. Call external calendar API
    success, event_id = await call_external_calendar_api(...)
    
    if success:
        # 2. Create appointment record in database
        query = """
            INSERT INTO appointments (
                organization_id, contact_id, appointment_date,
                service_type, status, notes
            ) VALUES (%s, %s, %s, %s, 'scheduled', %s)
        """
        cursor.execute(query, (
            organization_id, contact_id, start_time, title,
            f"Booked via AI caller. Event ID: {event_id}"
        ))
        conn.commit()
        
        # 3. Track usage
        track_usage(organization_id, 'api_requests', 1)
    
    return success, event_id
```

---

## Complete Migration Checklist

- [ ] Run `database-saas-setup.sql` to create new tables
- [ ] Migrate existing `doc_mappings` data to include `organization_id`
- [ ] Update all database queries to include `organization_id` filter
- [ ] Replace `user_profiles` references with `contacts`
- [ ] Update `conversation_logs` to use new `calls` table structure
- [ ] Add usage tracking calls throughout the code
- [ ] Implement sentiment analysis
- [ ] Update appointment booking to create database records
- [ ] Add organization status checking (active/suspended)
- [ ] Test with multiple organizations to verify data isolation

---

## Testing Multi-Tenancy

```python
# Test 1: Verify data isolation
org1_calls = get_calls_for_organization(1)
org2_calls = get_calls_for_organization(2)
assert no overlap between org1_calls and org2_calls

# Test 2: Verify contact isolation
contact1 = get_contact(phone="+1234567890", org_id=1)
contact2 = get_contact(phone="+1234567890", org_id=2)
assert contact1.id != contact2.id  # Same phone, different orgs

# Test 3: Verify usage tracking
track_usage(1, 'calls', 1)
metrics = get_usage_metrics(1)
assert metrics['calls'] > 0
```

---

## Security Considerations

1. **Always filter by organization_id**
```python
# ✅ CORRECT
SELECT * FROM calls WHERE organization_id = %s AND status = 'answered'

# ❌ WRONG - Exposes all organizations!
SELECT * FROM calls WHERE status = 'answered'
```

2. **Validate organization access**
```python
def validate_organization_access(twilio_phone: str) -> Optional[int]:
    org_id, _, _ = get_mapping_from_db(twilio_phone)
    if not org_id:
        logging.error(f"Unauthorized access attempt from {twilio_phone}")
        return None
    return org_id
```

3. **Check organization status**
```python
def is_organization_active(org_id: int) -> bool:
    query = "SELECT status FROM organizations WHERE id = %s"
    result = cursor.fetchone()
    return result and result[0] == 'active'
```

---

## Performance Optimization

1. **Add indexes**
```sql
CREATE INDEX idx_calls_org_date ON calls(organization_id, DATE(created_at));
CREATE INDEX idx_contacts_org_phone ON contacts(organization_id, phone);
CREATE INDEX idx_doc_mappings_phone ON doc_mappings(phone_number);
```

2. **Cache organization lookups**
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_organization_cached(twilio_phone: str):
    return get_mapping_from_db(twilio_phone)
```

3. **Batch usage tracking**
```python
# Instead of tracking each call individually, batch them
usage_buffer = []
if len(usage_buffer) >= 10:
    bulk_insert_usage_metrics(usage_buffer)
    usage_buffer.clear()
```

---

Your Python application is now ready for SaaS multi-tenancy! 🎉
