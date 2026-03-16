# Call Center AI SaaS - Test Cases

**Application:** Call Center AI Analytics Dashboard  
**Version:** 1.0.0  
**Date:** March 12, 2026  
**Environment:** Multi-Tenant SaaS with Twilio Integration

---

## Table of Contents
1. [System Setup Tests](#system-setup-tests)
2. [Authentication & Multi-Tenancy Tests](#authentication--multi-tenancy-tests)
3. [Call Handling Tests](#call-handling-tests)
4. [Dashboard Tests](#dashboard-tests)
5. [API Tests](#api-tests)
6. [Database Tests](#database-tests)
7. [Performance Tests](#performance-tests)
8. [Security Tests](#security-tests)

---

## System Setup Tests

### TC-001: Database Connection
**Objective:** Verify database connection is established  
**Steps:**
1. Start the application
2. Check database connection logs
3. Verify MySQL connection pool is active

**Expected Result:** Connection successful, no errors in logs  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-002: Environment Variables
**Objective:** Verify all required environment variables are set  
**Steps:**
1. Check `.env.local` file exists
2. Verify DB_HOST, DB_USER, DB_PASSWORD, DB_NAME are set
3. Verify ORGANIZATION_ID is set
4. Verify OpenAI API key is configured

**Expected Result:** All variables present and valid  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-003: API Health Check
**Objective:** Verify API health endpoint responds  
**Steps:**
1. Call GET `/api/health`
2. Check response status code
3. Verify response contains system status

**Expected Result:** Status 200, response shows "OK"  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

## Authentication & Multi-Tenancy Tests

### TC-004: Organization Isolation
**Objective:** Verify data isolation between organizations  
**Steps:**
1. Set ORGANIZATION_ID=1 (Acme Corporation)
2. Fetch calls from `/api/data`
3. Verify only Acme's calls are returned
4. Change ORGANIZATION_ID=2 (TechStart Inc)
5. Fetch calls again
6. Verify only TechStart's calls are returned

**Expected Result:** Each org sees only their data  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-005: Multi-Tenant User Access
**Objective:** Verify users can only access their organization  
**Steps:**
1. Login as user from Acme Corporation
2. Attempt to access TechStart Inc data
3. Verify access denied

**Expected Result:** Access denied, 403 error  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-006: Subscription Plan Limits
**Objective:** Verify subscription limits are enforced  
**Steps:**
1. Set organization to Starter plan (1000 calls/month)
2. Attempt to log 1001st call
3. Verify rejection or warning

**Expected Result:** Call rejected or warning shown  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

## Call Handling Tests

### TC-007: Incoming Call Processing
**Objective:** Verify incoming call is processed correctly  
**Steps:**
1. Make test call to Twilio number
2. Verify call is answered by AI
3. Check call is logged in database
4. Verify call appears in Activity Feed

**Expected Result:** Call logged, appears in dashboard  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-008: First-Time Caller Detection
**Objective:** Verify first-time callers are identified  
**Steps:**
1. Call from new phone number
2. AI should ask for name and email
3. Verify contact is created in database
4. Verify contact marked as first-time caller

**Expected Result:** New contact created with name/email  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-009: Returning Caller Recognition
**Objective:** Verify returning callers are recognized  
**Steps:**
1. Call from existing contact phone number
2. AI should greet by name (if available)
3. Verify call linked to existing contact
4. Verify call count incremented

**Expected Result:** Contact recognized, call count updated  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-010: Call Transcription
**Objective:** Verify call is transcribed  
**Steps:**
1. Make test call with speech
2. Wait for call to complete
3. Check Activity Feed for transcript
4. Verify transcript is accurate

**Expected Result:** Full transcript captured and displayed  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-011: AI Summary Generation
**Objective:** Verify AI generates call summary  
**Steps:**
1. Complete a call
2. Check Activity Feed
3. Verify AI Summary section populated
4. Verify summary is relevant to call

**Expected Result:** Summary generated and displayed  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-012: Sentiment Analysis
**Objective:** Verify sentiment is analyzed  
**Steps:**
1. Make positive call ("Great service!")
2. Check Activity Feed sentiment tag
3. Make negative call ("This is terrible")
4. Check sentiment tag

**Expected Result:** Correct sentiment detected (positive/negative)  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-013: Intent Detection
**Objective:** Verify call intent is detected  
**Steps:**
1. Call with "I want to schedule an appointment"
2. Verify intent shows "Schedule Appointment"
3. Call with "What are your prices?"
4. Verify intent shows "Pricing Inquiry"

**Expected Result:** Correct intents detected  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-014: Appointment Scheduling
**Objective:** Verify appointments can be scheduled  
**Steps:**
1. Call and say "I'd like to book an appointment for tomorrow at 2pm"
2. AI should confirm appointment
3. Check Calendar page
4. Verify appointment appears with correct date/time

**Expected Result:** Appointment created and visible in calendar  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-015: Callback Request
**Objective:** Verify callback requests are captured  
**Steps:**
1. Call and say "Can you call me back later?"
2. AI should confirm callback
3. Check Calendar page
4. Verify callback appears as appointment

**Expected Result:** Callback scheduled and visible  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-016: Call Hangup on Farewell
**Objective:** Verify call ends after farewell phrase  
**Steps:**
1. Make test call
2. Say "Thank you, goodbye"
3. Verify call disconnects
4. Verify call duration is recorded

**Expected Result:** Call ends gracefully, duration recorded  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-017: Knowledge Base Integration
**Objective:** Verify AI answers from knowledge base  
**Steps:**
1. Call and ask "What are your company policies?"
2. AI should answer from knowledge base
3. Verify answer is relevant
4. Check call summary includes knowledge base reference

**Expected Result:** AI answers from knowledge base  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

## Dashboard Tests

### TC-018: Real-Time KPI Updates
**Objective:** Verify KPIs update in real-time  
**Steps:**
1. Open Dashboard
2. Note current Total Calls value
3. Make a test call
4. Wait 5 seconds
5. Verify Total Calls incremented

**Expected Result:** KPI updates within 5 seconds  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-019: Call Volume Chart
**Objective:** Verify call volume chart displays data  
**Steps:**
1. Open Dashboard
2. Check Call Volume Chart
3. Verify data points for each hour
4. Verify chart is interactive

**Expected Result:** Chart displays with correct data  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-020: Recent Calls Table
**Objective:** Verify recent calls display correctly  
**Steps:**
1. Open Dashboard
2. Check Recent Calls Table
3. Verify latest calls appear first
4. Verify caller name, phone, duration shown

**Expected Result:** Table shows recent calls in correct order  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-021: Activity Feed Filtering
**Objective:** Verify activity feed filters work  
**Steps:**
1. Open Activity Feed
2. Click "Answered" filter
3. Verify only answered calls shown
4. Click "Missed" filter
5. Verify only missed calls shown

**Expected Result:** Filters work correctly  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-022: Contacts Page Display
**Objective:** Verify contacts display correctly  
**Steps:**
1. Open Contacts page
2. Verify contact cards show name, company, phone
3. Verify total calls count is accurate
4. Verify last contact date is shown

**Expected Result:** All contact info displayed correctly  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-023: Contacts Search
**Objective:** Verify contact search works  
**Steps:**
1. Open Contacts page
2. Search for "Sarah"
3. Verify only Sarah's contact shown
4. Search for "+1-555"
5. Verify contacts with that phone prefix shown

**Expected Result:** Search filters contacts correctly  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-024: Calendar View
**Objective:** Verify calendar displays appointments  
**Steps:**
1. Open Calendar page
2. Verify appointments listed
3. Check status badges (scheduled, completed, etc.)
4. Verify appointment details shown

**Expected Result:** Calendar shows all appointments with details  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-025: Analytics Charts
**Objective:** Verify analytics charts display  
**Steps:**
1. Open Analytics page
2. Verify Weekly Call Volume chart
3. Verify Sentiment Distribution pie chart
4. Verify Top Call Intents bar chart
5. Verify Peak Hours line chart

**Expected Result:** All charts display with data  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-026: Settings Page
**Objective:** Verify settings can be updated  
**Steps:**
1. Open Settings page
2. Update profile name
3. Click Save Changes
4. Verify success message
5. Refresh page
6. Verify changes persisted

**Expected Result:** Settings saved and persisted  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-027: Admin Panel - Organizations
**Objective:** Verify admin can view organizations  
**Steps:**
1. Open Admin Panel
2. Click Organizations tab
3. Verify all organizations listed
4. Verify plan, call count, status shown

**Expected Result:** Organizations displayed correctly  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-028: Admin Panel - Users
**Objective:** Verify admin can view users  
**Steps:**
1. Open Admin Panel
2. Click Users tab
3. Verify all users listed
4. Verify organization, role shown

**Expected Result:** Users displayed correctly  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-029: Admin Panel - Subscriptions
**Objective:** Verify admin can view subscriptions  
**Steps:**
1. Open Admin Panel
2. Click Subscriptions tab
3. Verify all subscriptions listed
4. Verify plan, amount, next billing date shown

**Expected Result:** Subscriptions displayed correctly  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-030: Admin Panel - System Health
**Objective:** Verify system health status  
**Steps:**
1. Open Admin Panel
2. Click System Health tab
3. Verify Database status shows "Healthy"
4. Verify API Server status shows "Healthy"
5. Verify metrics displayed

**Expected Result:** All systems show healthy status  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

## API Tests

### TC-031: GET /api/data
**Objective:** Verify data endpoint returns calls  
**Steps:**
1. Call GET `/api/data`
2. Check response status code
3. Verify response contains calls array
4. Verify each call has required fields

**Expected Result:** Status 200, calls array with valid data  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-032: GET /api/contacts
**Objective:** Verify contacts endpoint returns contacts  
**Steps:**
1. Call GET `/api/contacts`
2. Check response status code
3. Verify response contains contacts array
4. Verify each contact has required fields

**Expected Result:** Status 200, contacts array with valid data  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-033: GET /api/appointments
**Objective:** Verify appointments endpoint returns appointments  
**Steps:**
1. Call GET `/api/appointments`
2. Check response status code
3. Verify response contains appointments array
4. Verify each appointment has required fields

**Expected Result:** Status 200, appointments array with valid data  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-034: GET /api/dashboard/stats
**Objective:** Verify stats endpoint returns metrics  
**Steps:**
1. Call GET `/api/dashboard/stats`
2. Check response status code
3. Verify response contains all KPI metrics
4. Verify metrics are numeric

**Expected Result:** Status 200, all metrics present and numeric  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-035: GET /api/realtime (SSE)
**Objective:** Verify real-time endpoint streams data  
**Steps:**
1. Connect to GET `/api/realtime`
2. Verify connection established
3. Wait for data stream
4. Verify data updates every 5 seconds
5. Verify data format is valid JSON

**Expected Result:** SSE connection active, data streaming  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-036: API Error Handling
**Objective:** Verify API returns proper error responses  
**Steps:**
1. Call GET `/api/invalid-endpoint`
2. Verify 404 response
3. Call GET `/api/data` with invalid org ID
4. Verify 400 or 403 response

**Expected Result:** Proper error codes and messages  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

## Database Tests

### TC-037: Call Record Creation
**Objective:** Verify call records are created correctly  
**Steps:**
1. Make a test call
2. Query database: `SELECT * FROM calls WHERE caller_phone = '+1-555-TEST'`
3. Verify record exists with all fields populated
4. Verify organization_id matches

**Expected Result:** Call record created with correct data  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-038: Contact Record Creation
**Objective:** Verify contact records are created correctly  
**Steps:**
1. Make call from new number
2. Query database: `SELECT * FROM contacts WHERE phone = '+1-555-NEW'`
3. Verify record exists with name, email
4. Verify organization_id matches

**Expected Result:** Contact record created with correct data  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-039: Appointment Record Creation
**Objective:** Verify appointment records are created  
**Steps:**
1. Schedule appointment via call
2. Query database: `SELECT * FROM appointments WHERE contact_id = X`
3. Verify record exists with date, service type, status
4. Verify organization_id matches

**Expected Result:** Appointment record created correctly  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-040: Data Isolation Verification
**Objective:** Verify data is isolated by organization  
**Steps:**
1. Query: `SELECT COUNT(*) FROM calls WHERE organization_id = 1`
2. Query: `SELECT COUNT(*) FROM calls WHERE organization_id = 2`
3. Verify counts are different
4. Verify no cross-organization data leakage

**Expected Result:** Data properly isolated by organization  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-041: Usage Metrics Tracking
**Objective:** Verify usage is tracked for billing  
**Steps:**
1. Make 5 test calls
2. Query: `SELECT * FROM usage_metrics WHERE organization_id = 1 AND metric_type = 'calls'`
3. Verify usage incremented by 5
4. Verify period dates are correct

**Expected Result:** Usage metrics tracked accurately  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

## Performance Tests

### TC-042: Dashboard Load Time
**Objective:** Verify dashboard loads within acceptable time  
**Steps:**
1. Open Dashboard
2. Measure time to full page load
3. Verify all components rendered
4. Verify no console errors

**Expected Result:** Page loads in < 3 seconds  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-043: Real-Time Update Latency
**Objective:** Verify real-time updates are fast  
**Steps:**
1. Make a test call
2. Measure time from call end to KPI update
3. Verify update appears within 5 seconds

**Expected Result:** Update latency < 5 seconds  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-044: Database Query Performance
**Objective:** Verify database queries are fast  
**Steps:**
1. Query 1000 calls: `SELECT * FROM calls LIMIT 1000`
2. Measure query time
3. Verify response time < 1 second

**Expected Result:** Query completes in < 1 second  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-045: Concurrent Users
**Objective:** Verify system handles multiple concurrent users  
**Steps:**
1. Simulate 10 concurrent dashboard users
2. Verify all users can access data
3. Verify no timeouts or errors
4. Verify response times acceptable

**Expected Result:** System handles 10 concurrent users  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

## Security Tests

### TC-046: SQL Injection Prevention
**Objective:** Verify SQL injection is prevented  
**Steps:**
1. Attempt SQL injection in search: `'; DROP TABLE calls; --`
2. Verify query fails safely
3. Verify no data deleted
4. Verify error message doesn't expose SQL

**Expected Result:** Injection prevented, no data loss  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-047: XSS Prevention
**Objective:** Verify XSS attacks are prevented  
**Steps:**
1. Attempt XSS in contact name: `<script>alert('XSS')</script>`
2. Verify script doesn't execute
3. Verify text displayed as plain text
4. Verify no console errors

**Expected Result:** XSS prevented, script not executed  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-048: CSRF Protection
**Objective:** Verify CSRF attacks are prevented  
**Steps:**
1. Attempt form submission without CSRF token
2. Verify request rejected
3. Verify error message shown

**Expected Result:** CSRF attack prevented  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-049: Authentication Required
**Objective:** Verify unauthenticated users can't access dashboard  
**Steps:**
1. Clear authentication cookies
2. Attempt to access `/dashboard`
3. Verify redirect to login page
4. Verify no data exposed

**Expected Result:** Redirect to login, no data exposed  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

### TC-050: Rate Limiting
**Objective:** Verify API rate limiting works  
**Steps:**
1. Make 100 requests to `/api/data` in 1 second
2. Verify requests are rate limited
3. Verify 429 (Too Many Requests) response
4. Verify can retry after cooldown

**Expected Result:** Rate limiting enforced  
**Status:** [ ] Pass [ ] Fail  
**Notes:** _______________

---

## Test Summary

**Total Test Cases:** 50  
**Passed:** _____ / 50  
**Failed:** _____ / 50  
**Skipped:** _____ / 50  

**Overall Status:** [ ] PASS [ ] FAIL

**Critical Issues Found:**
- _______________
- _______________
- _______________

**Recommendations:**
- _______________
- _______________
- _______________

**Tested By:** _______________  
**Date:** _______________  
**Signature:** _______________
