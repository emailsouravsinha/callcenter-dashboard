'use client'

import { useState, useEffect } from 'react'
import { Building, Users, Plus, Trash2, AlertCircle, CheckCircle, Copy, X } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'

interface Organization {
  id: number
  name: string
  slug: string
  status: string
  user_count: number
  created_at: string
}

interface UserRecord {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  organization_id: number
  org_name: string
  created_at: string
}

export default function AdminPage() {
  const { token, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<'organizations' | 'users'>('organizations')
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [users, setUsers] = useState<UserRecord[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  // Organization form
  const [showOrgForm, setShowOrgForm] = useState(false)
  const [orgForm, setOrgForm] = useState({ name: '', slug: '' })

  // User form
  const [showUserForm, setShowUserForm] = useState(false)
  const [userForm, setUserForm] = useState({
    email: '', firstName: '', lastName: '', role: 'agent', organizationId: '',
  })
  const [tempPassword, setTempPassword] = useState('')

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => {
    if (token) {
      fetchOrganizations()
      fetchUsers()
    }
  }, [token])

  const fetchOrganizations = async () => {
    try {
      const res = await fetch('/api/admin/organizations', { headers })
      const data = await res.json()
      if (data.organizations) setOrganizations(data.organizations)
    } catch { /* ignore */ }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', { headers })
      const data = await res.json()
      if (data.users) setUsers(data.users)
    } catch { /* ignore */ }
  }

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST', headers,
        body: JSON.stringify(orgForm),
      })
      const data = await res.json()
      if (!res.ok) { setMessage({ type: 'error', text: data.error }); return }
      setMessage({ type: 'success', text: `Organization "${orgForm.name}" created` })
      setOrgForm({ name: '', slug: '' })
      setShowOrgForm(false)
      fetchOrganizations()
    } catch { setMessage({ type: 'error', text: 'Failed to create organization' }) }
    finally { setLoading(false) }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setTempPassword('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers,
        body: JSON.stringify(userForm),
      })
      const data = await res.json()
      if (!res.ok) { setMessage({ type: 'error', text: data.error }); return }
      setMessage({ type: 'success', text: `User ${userForm.email} created. Welcome email sent.` })
      setTempPassword(data.tempPassword)
      setUserForm({ email: '', firstName: '', lastName: '', role: 'agent', organizationId: '' })
      fetchUsers()
    } catch { setMessage({ type: 'error', text: 'Failed to create user' }) }
    finally { setLoading(false) }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE', headers,
        body: JSON.stringify({ userId }),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'User deactivated' })
        fetchUsers()
      }
    } catch { setMessage({ type: 'error', text: 'Failed to deactivate user' }) }
  }

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  if (authLoading) {
    return <DashboardLayout><div className="p-6"><div className="animate-pulse h-8 bg-gray-200 rounded w-1/4" /></div></DashboardLayout>
  }

  const roleColors: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    manager: 'bg-indigo-100 text-indigo-700',
    agent: 'bg-gray-100 text-gray-700',
    read_only: 'bg-yellow-100 text-yellow-700',
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Admin Panel</h1>
          <p className="text-gray-600">Manage customer organizations and users</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-xl flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
            <p className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{message.text}</p>
          </div>
        )}

        {/* Temp password display */}
        {tempPassword && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800 font-medium mb-2">Temporary password (share if email delivery fails):</p>
            <div className="flex items-center gap-2">
              <code className="bg-white px-3 py-1.5 rounded-lg border text-sm font-mono">{tempPassword}</code>
              <button onClick={() => { navigator.clipboard.writeText(tempPassword); }} className="p-1.5 hover:bg-amber-100 rounded-lg" title="Copy">
                <Copy className="w-4 h-4 text-amber-700" />
              </button>
              <button onClick={() => setTempPassword('')} className="p-1.5 hover:bg-amber-100 rounded-lg ml-auto" title="Dismiss">
                <X className="w-4 h-4 text-amber-700" />
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-8">
            {[
              { id: 'organizations' as const, label: 'Organizations', icon: Building },
              { id: 'users' as const, label: 'Users', icon: Users },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-4 border-b-2 transition-colors ${activeTab === tab.id ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Organizations Tab */}
        {activeTab === 'organizations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Customer Organizations ({organizations.length})</h2>
              <button onClick={() => setShowOrgForm(!showOrgForm)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium text-sm">
                <Plus className="w-4 h-4" /> Add Organization
              </button>
            </div>

            {showOrgForm && (
              <form onSubmit={handleCreateOrg} className="bg-white rounded-xl shadow p-6 space-y-4 border border-purple-100">
                <h3 className="font-semibold text-gray-900">New Organization</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Name</label>
                    <input type="text" value={orgForm.name}
                      onChange={(e) => setOrgForm({ name: e.target.value, slug: autoSlug(e.target.value) })}
                      placeholder="Acme Corporation" required
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug (URL-friendly)</label>
                    <input type="text" value={orgForm.slug}
                      onChange={(e) => setOrgForm({ ...orgForm, slug: e.target.value })}
                      placeholder="acme-corporation" required
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowOrgForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-900">Cancel</button>
                  <button type="submit" disabled={loading}
                    className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 font-medium">
                    {loading ? 'Creating...' : 'Create Organization'}
                  </button>
                </div>
              </form>
            )}

            <div className="bg-white rounded-xl shadow overflow-hidden">
              {organizations.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No organizations yet. Add your first customer.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {organizations.map((org) => (
                      <tr key={org.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                              <Building className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{org.name}</p>
                              <p className="text-xs text-gray-500">ID: {org.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">{org.slug}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{org.user_count}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">{org.status}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(org.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Users ({users.length})</h2>
              <button onClick={() => setShowUserForm(!showUserForm)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium text-sm">
                <Plus className="w-4 h-4" /> Add User
              </button>
            </div>

            {showUserForm && (
              <form onSubmit={handleCreateUser} className="bg-white rounded-xl shadow p-6 space-y-4 border border-purple-100">
                <h3 className="font-semibold text-gray-900">New User</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                    <input type="text" value={userForm.firstName}
                      onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                      placeholder="John" required
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                    <input type="text" value={userForm.lastName}
                      onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                      placeholder="Doe" required
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input type="email" value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      placeholder="john@company.com" required
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization</label>
                    <select value={userForm.organizationId}
                      onChange={(e) => setUserForm({ ...userForm, organizationId: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <option value="">Select organization</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                    <select value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                      <option value="agent">Agent</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                      <option value="read_only">Read Only</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-500">A temporary password will be generated and emailed to the user.</p>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowUserForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-900">Cancel</button>
                  <button type="submit" disabled={loading}
                    className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 font-medium">
                    {loading ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            )}

            <div className="bg-white rounded-xl shadow overflow-hidden">
              {users.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No users yet. Add your first user above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{u.first_name} {u.last_name}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{u.org_name}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[u.role] || 'bg-gray-100 text-gray-700'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {u.is_active && (
                              <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-700" title="Deactivate user">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
