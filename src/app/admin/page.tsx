'use client'

import { useState } from 'react'
import { Building, Users, CreditCard, Activity, Shield, Database } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('organizations')

  const tabs = [
    { id: 'organizations', name: 'Organizations', icon: Building },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'subscriptions', name: 'Subscriptions', icon: CreditCard },
    { id: 'system', name: 'System Health', icon: Activity },
  ]

  const organizations = [
    { id: 1, name: 'Acme Corporation', plan: 'Professional', calls: 1282, status: 'active' },
    { id: 2, name: 'TechStart Inc', plan: 'Starter', calls: 456, status: 'active' },
    { id: 3, name: 'Global Services', plan: 'Enterprise', calls: 3421, status: 'active' },
  ]

  const users = [
    { id: 1, name: 'John Doe', email: 'john@acme.com', role: 'admin', org: 'Acme Corporation' },
    { id: 2, name: 'Jane Smith', email: 'jane@acme.com', role: 'agent', org: 'Acme Corporation' },
    { id: 3, name: 'Bob Wilson', email: 'bob@techstart.com', role: 'owner', org: 'TechStart Inc' },
  ]

  const subscriptions = [
    { org: 'Acme Corporation', plan: 'Professional', amount: '$99/mo', status: 'active', nextBilling: '2026-04-12' },
    { org: 'TechStart Inc', plan: 'Starter', amount: '$29/mo', status: 'active', nextBilling: '2026-04-15' },
    { org: 'Global Services', plan: 'Enterprise', amount: '$299/mo', status: 'active', nextBilling: '2026-04-10' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Admin Panel</h1>
          <p className="text-gray-600">Multi-tenant system administration</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'organizations' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Organizations</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add Organization
              </button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Calls</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <Building className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{org.name}</p>
                            <p className="text-sm text-gray-500">ID: {org.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                          {org.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{org.calls.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          {org.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Users</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add User
              </button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{user.org}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          user.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Subscriptions & Billing</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Billing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {subscriptions.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{sub.org}</td>
                      <td className="px-6 py-4">{sub.plan}</td>
                      <td className="px-6 py-4 font-semibold text-green-600">{sub.amount}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{sub.nextBilling}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">System Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <Database className="w-8 h-8 text-blue-600" />
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Healthy</span>
                </div>
                <h3 className="font-semibold mb-1">Database</h3>
                <p className="text-sm text-gray-600">MySQL connection active</p>
                <p className="text-xs text-gray-500 mt-2">Last checked: 2 minutes ago</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-8 h-8 text-green-600" />
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Healthy</span>
                </div>
                <h3 className="font-semibold mb-1">API Server</h3>
                <p className="text-sm text-gray-600">All endpoints responding</p>
                <p className="text-xs text-gray-500 mt-2">Uptime: 99.9%</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <Shield className="w-8 h-8 text-purple-600" />
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Secure</span>
                </div>
                <h3 className="font-semibold mb-1">Security</h3>
                <p className="text-sm text-gray-600">No threats detected</p>
                <p className="text-xs text-gray-500 mt-2">Last scan: 1 hour ago</p>
              </div>
            </div>

            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">System Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total API Requests</p>
                  <p className="text-2xl font-bold">1.2M</p>
                  <p className="text-xs text-green-600 mt-1">+12% from last month</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Average Response Time</p>
                  <p className="text-2xl font-bold">145ms</p>
                  <p className="text-xs text-green-600 mt-1">-8% from last month</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Error Rate</p>
                  <p className="text-2xl font-bold">0.02%</p>
                  <p className="text-xs text-green-600 mt-1">Within target</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Users</p>
                  <p className="text-2xl font-bold">247</p>
                  <p className="text-xs text-blue-600 mt-1">Currently online</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
