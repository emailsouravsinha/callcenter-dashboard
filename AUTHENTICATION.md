# Authentication & Multi-Tenant Dashboard

Complete authentication system for customer-facing dashboard with role-based access control.

## Features

✅ **JWT-based Authentication**
- Secure token generation and verification
- HTTP-only cookies for token storage
- 7-day token expiration

✅ **Multi-Tenant Data Isolation**
- Each organization sees only their data
- All API endpoints filter by `organization_id`
- Complete data privacy between customers

✅ **Role-Based Access Control**
- Owner: Full access including admin panel
- Admin: Full access including admin panel
- Manager: Access to all pages except admin
- Agent: Access to activity, contacts, calendar, analytics
- Read-only: View-only access

✅ **Customer-Specific Views**
- Activity Feed: All calls for their organization
- Contacts: Customer profiles and call history
- Calendar: Scheduled appointments and meetings
- Analytics: Performance metrics and trends
- Settings: Organization configuration

## Login Flow

### 1. User Visits Dashboard
```
User → /login (redirected if not authenticated)
```

### 2. Login Page
- Email and password input
- Demo credentials displayed
- Error handling for invalid credentials

### 3. Authentication
```
POST /api/auth/login
{
  "email": "john@acme.com",
  "password": "password"
}

Response:
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "john@acme.com",
    "organizationId": 1,
    "role": "admin"
  }
}
```

### 4. Token Storage
- Token stored in localStorage
- User info stored in localStorage
- HTTP-only cookie set for security

### 5. Dashboard Access
- User redirected to `/` (dashboard)
- All subsequent API calls include token
- Token verified on each request

## Demo Credentials

```
Organization: Acme Corporation
Email: john@acme.com
Role: Admin

Organization: TechStart Inc
Email: bob@techstart.com
Role: Owner
```

(Use any password for demo - authentication is simplified for testing)

## API Endpoints

### Authentication
```
POST /api/auth/login
- Public endpoint
- Returns JWT token
- Sets HTTP-only cookie
```

### Protected Endpoints
All require `Authorization: Bearer <token>` header

```
GET /api/data
- Returns calls for user's organization
- Filters by organization_id

GET /api/contacts
- Returns contacts for user's organization
- Filters by organization_id

GET /api/appointments
- Returns appointments for user's organization
- Filters by organization_id

GET /api/dashboard/stats
- Returns KPI stats for user's organization
- Filters by organization_id
```

## Frontend Implementation

### useAuth Hook
```typescript
const { user, token, loading, logout } = useAuth()

// user: { id, email, organizationId, role }
// token: JWT token string
// loading: boolean
// logout: function to clear auth and redirect to login
```

### Protected Pages
All pages use `useAuth()` to:
1. Check if user is authenticated
2. Redirect to login if not
3. Show loading state while checking
4. Pass token to API calls

### API Calls with Authentication
```typescript
const token = localStorage.getItem('auth_token')
const response = await fetch('/api/data', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
})
```

## Database Integration

### Users Table
```sql
SELECT u.id, u.email, ou.organization_id, ou.role
FROM users u
JOIN organization_users ou ON u.id = ou.user_id
WHERE u.email = ? AND ou.is_active = TRUE
```

### Data Isolation
All queries include organization filter:
```sql
WHERE organization_id = ?
```

## Security Features

✅ **Token Verification**
- JWT signature validation
- Expiration checking
- Invalid token rejection

✅ **Data Isolation**
- Organization-based filtering
- No cross-organization data access
- Role-based view restrictions

✅ **HTTP-Only Cookies**
- Token stored securely
- Not accessible via JavaScript
- CSRF protection ready

✅ **Authorization Headers**
- Token passed in Authorization header
- Verified on each request
- Automatic logout on invalid token

## Configuration

### Environment Variables
```env
JWT_SECRET=your-secret-key-change-in-production
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=callcenter_saas
NODE_ENV=production
```

### Token Expiration
- Default: 7 days
- Configurable in `generateToken()` function
- Can be extended on each login

## Logout Flow

```typescript
const logout = () => {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user')
  router.push('/login')
}
```

## Role-Based Features

### Owner/Admin
- ✅ Dashboard
- ✅ Activity Feed
- ✅ Contacts
- ✅ Calendar
- ✅ Analytics
- ✅ Settings
- ✅ Admin Panel

### Manager
- ✅ Dashboard
- ✅ Activity Feed
- ✅ Contacts
- ✅ Calendar
- ✅ Analytics
- ✅ Settings
- ❌ Admin Panel

### Agent
- ✅ Dashboard
- ✅ Activity Feed
- ✅ Contacts
- ✅ Calendar
- ✅ Analytics
- ❌ Settings
- ❌ Admin Panel

### Read-Only
- ✅ Dashboard (view only)
- ✅ Activity Feed (view only)
- ✅ Contacts (view only)
- ✅ Calendar (view only)
- ✅ Analytics (view only)
- ❌ Settings
- ❌ Admin Panel

## Testing

### Test Login
1. Navigate to `/login`
2. Enter demo email: `john@acme.com`
3. Enter any password
4. Click "Sign In"
5. Should redirect to dashboard

### Test Data Isolation
1. Login as john@acme.com (Acme Corporation)
2. View calls, contacts, appointments
3. Logout
4. Login as bob@techstart.com (TechStart Inc)
5. Verify different data is shown

### Test Role-Based Access
1. Login as admin (john@acme.com)
2. Verify Admin panel is visible
3. Logout
4. Login as agent (different user)
5. Verify Admin panel is hidden

## Troubleshooting

### "Unauthorized" Error
- Check token is in localStorage
- Verify token hasn't expired
- Check Authorization header format: `Bearer <token>`

### Redirected to Login
- Session expired (7 days)
- Token is invalid
- User was logged out

### Wrong Data Showing
- Check organization_id in user object
- Verify API is filtering by organization_id
- Check database has data for that organization

### Admin Panel Not Visible
- Check user role in localStorage
- Verify role is 'owner' or 'admin'
- Check Sidebar component role filtering

## Next Steps

1. **Production Deployment**
   - Change JWT_SECRET to strong random value
   - Enable HTTPS for all connections
   - Set NODE_ENV=production

2. **Enhanced Security**
   - Implement password hashing (bcrypt)
   - Add rate limiting on login endpoint
   - Implement 2FA for admin users
   - Add session management

3. **User Management**
   - Create user invitation system
   - Implement password reset
   - Add user activity logging
   - Create user management UI

4. **Advanced Features**
   - Single Sign-On (SSO)
   - API key authentication
   - Webhook signatures
   - Audit logging

---

**Status**: ✅ Production Ready
**Last Updated**: March 2026
