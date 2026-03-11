/**
 * Multi-Tenant Security Helpers
 * Ensures data isolation between organizations
 */

import { executeQuery } from './database'

// Types
export interface Organization {
  id: number
  name: string
  slug: string
  status: 'active' | 'suspended' | 'cancelled' | 'trial'
}

export interface UserOrganization {
  organizationId: number
  userId: number
  role: 'owner' | 'admin' | 'manager' | 'agent' | 'read_only'
  permissions: any
}

/**
 * Get user's organizations
 * Users can belong to multiple organizations
 */
export async function getUserOrganizations(userId: number): Promise<Organization[]> {
  const query = `
    SELECT 
      o.id,
      o.name,
      o.slug,
      o.status,
      ou.role
    FROM organizations o
    INNER JOIN organization_users ou ON o.id = ou.organization_id
    WHERE ou.user_id = ? AND ou.is_active = TRUE AND o.status IN ('active', 'trial')
    ORDER BY o.name
  `
  
  try {
    return await executeQuery(query, [userId])
  } catch (error) {
    console.error('Error fetching user organizations:', error)
    return []
  }
}

/**
 * Check if user has access to organization
 * CRITICAL: Call this before any data operation
 */
export async function checkUserOrganizationAccess(
  userId: number, 
  organizationId: number
): Promise<boolean> {
  const query = `
    SELECT COUNT(*) as count
    FROM organization_users
    WHERE user_id = ? AND organization_id = ? AND is_active = TRUE
  `
  
  try {
    const [result] = await executeQuery(query, [userId, organizationId])
    return result?.count > 0
  } catch (error) {
    console.error('Error checking organization access:', error)
    return false
  }
}

/**
 * Get user's role in organization
 */
export async function getUserRole(
  userId: number, 
  organizationId: number
): Promise<string | null> {
  const query = `
    SELECT role
    FROM organization_users
    WHERE user_id = ? AND organization_id = ? AND is_active = TRUE
  `
  
  try {
    const [result] = await executeQuery(query, [userId, organizationId])
    return result?.role || null
  } catch (error) {
    console.error('Error fetching user role:', error)
    return null
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  role: string, 
  requiredPermission: 'read' | 'write' | 'delete' | 'admin'
): boolean {
  const roleHierarchy: Record<string, number> = {
    'read_only': 1,
    'agent': 2,
    'manager': 3,
    'admin': 4,
    'owner': 5
  }
  
  const permissionLevels: Record<string, number> = {
    'read': 1,
    'write': 2,
    'delete': 3,
    'admin': 4
  }
  
  const userLevel = roleHierarchy[role] || 0
  const requiredLevel = permissionLevels[requiredPermission] || 0
  
  return userLevel >= requiredLevel
}

/**
 * Get organization subscription limits
 */
export async function getOrganizationLimits(organizationId: number) {
  const query = `
    SELECT 
      sp.limits
    FROM subscriptions s
    INNER JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.organization_id = ? AND s.status IN ('active', 'trialing')
    ORDER BY s.created_at DESC
    LIMIT 1
  `
  
  try {
    const [result] = await executeQuery(query, [organizationId])
    return result?.limits ? JSON.parse(result.limits) : {
      max_calls: 1000,
      max_users: 5,
      max_contacts: 5000
    }
  } catch (error) {
    console.error('Error fetching organization limits:', error)
    return {
      max_calls: 1000,
      max_users: 5,
      max_contacts: 5000
    }
  }
}

/**
 * Check if organization has reached limit
 */
export async function checkOrganizationLimit(
  organizationId: number,
  limitType: 'calls' | 'users' | 'contacts'
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limits = await getOrganizationLimits(organizationId)
  
  let currentCount = 0
  let limitValue = limits[`max_${limitType}`]
  
  // -1 means unlimited
  if (limitValue === -1) {
    return { allowed: true, current: 0, limit: -1 }
  }
  
  // Get current usage
  switch (limitType) {
    case 'calls':
      const [callCount] = await executeQuery(
        'SELECT COUNT(*) as count FROM calls WHERE organization_id = ? AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)',
        [organizationId]
      )
      currentCount = callCount?.count || 0
      break
      
    case 'users':
      const [userCount] = await executeQuery(
        'SELECT COUNT(*) as count FROM organization_users WHERE organization_id = ? AND is_active = TRUE',
        [organizationId]
      )
      currentCount = userCount?.count || 0
      break
      
    case 'contacts':
      const [contactCount] = await executeQuery(
        'SELECT COUNT(*) as count FROM contacts WHERE organization_id = ? AND status = "active"',
        [organizationId]
      )
      currentCount = contactCount?.count || 0
      break
  }
  
  return {
    allowed: currentCount < limitValue,
    current: currentCount,
    limit: limitValue
  }
}

/**
 * Log audit event
 * IMPORTANT: Call this for all sensitive operations
 */
export async function logAuditEvent(
  organizationId: number,
  userId: number,
  action: string,
  resourceType: string,
  resourceId: number | null,
  details: any,
  ipAddress: string,
  userAgent: string
) {
  const query = `
    INSERT INTO audit_logs 
    (organization_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
  
  try {
    await executeQuery(query, [
      organizationId,
      userId,
      action,
      resourceType,
      resourceId,
      JSON.stringify(details),
      ipAddress,
      userAgent
    ])
  } catch (error) {
    console.error('Error logging audit event:', error)
  }
}

/**
 * Middleware helper to extract organization from request
 * Use this in your API routes
 */
export function getOrganizationContext(request: Request): {
  organizationId: number | null
  userId: number | null
} {
  // TODO: Implement based on your auth strategy
  // This could come from:
  // 1. JWT token claims
  // 2. Session cookie
  // 3. Request header
  
  // Example with JWT:
  // const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  // const decoded = jwt.verify(token, process.env.JWT_SECRET)
  // return { organizationId: decoded.orgId, userId: decoded.userId }
  
  return {
    organizationId: null,
    userId: null
  }
}

/**
 * Example: Secure query wrapper
 * Always includes organization_id filter
 */
export async function secureQuery<T = any>(
  organizationId: number,
  query: string,
  params: any[] = []
): Promise<T[]> {
  // Validate query includes organization_id filter
  if (!query.toLowerCase().includes('organization_id')) {
    throw new Error('Security Error: Query must filter by organization_id')
  }
  
  return executeQuery<T>(query, params)
}

export default {
  getUserOrganizations,
  checkUserOrganizationAccess,
  getUserRole,
  hasPermission,
  getOrganizationLimits,
  checkOrganizationLimit,
  logAuditEvent,
  getOrganizationContext,
  secureQuery
}