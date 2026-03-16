'use client'

import { useEffect, useState } from 'react'
import { User, Phone, Mail, Building, Calendar, TrendingUp } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'

interface Contact {
  id: number
  name: string
  company: string
  phone: string
  email: string
  total_calls: number
  status: string
  last_contact_date: string
}

export default function ContactsPage() {
  const { user, loading } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!loading && user) {
      fetchContacts()
    }
  }, [user, loading])

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/contacts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setPageLoading(false)
    }
  }

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.includes(searchTerm) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Contacts</h1>
          <p className="text-gray-600">Manage your customer relationships</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search contacts by name, company, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Total Contacts</p>
            <p className="text-2xl font-bold">{contacts.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {contacts.filter(c => c.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Total Calls</p>
            <p className="text-2xl font-bold">
              {contacts.reduce((sum, c) => sum + (c.total_calls || 0), 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Avg Calls/Contact</p>
            <p className="text-2xl font-bold">
              {contacts.length > 0 
                ? (contacts.reduce((sum, c) => sum + (c.total_calls || 0), 0) / contacts.length).toFixed(1)
                : 0
              }
            </p>
          </div>
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <div key={contact.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  contact.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {contact.status}
                </span>
              </div>

              <h3 className="font-semibold text-lg mb-1">{contact.name}</h3>
              
              {contact.company && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <Building className="w-4 h-4" />
                  <span>{contact.company}</span>
                </div>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{contact.phone}</span>
                </div>
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>{contact.total_calls || 0} calls</span>
                  </div>
                  {contact.last_contact_date && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(contact.last_contact_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'No contacts found matching your search' : 'No contacts yet'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

