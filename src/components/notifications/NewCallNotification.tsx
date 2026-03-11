'use client'

import { useEffect, useState } from 'react'
import { Phone, X, Eye } from 'lucide-react'
import { useRealtime } from '@/hooks/useRealtime'

export function NewCallNotification() {
  const { newCall, clearNewCall } = useRealtime()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (newCall) {
      setIsVisible(true)
    }
  }, [newCall])

  const handleClose = () => {
    setIsVisible(false)
    clearNewCall()
  }

  if (!newCall || !isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <Phone className="h-5 w-5 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">New Call</h4>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="mt-1 space-y-1">
              <p className="text-sm text-gray-900 font-medium">{newCall.caller}</p>
              <p className="text-xs text-gray-500">{newCall.phone}</p>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  newCall.outcome === 'Appointment Booked' 
                    ? 'bg-green-100 text-green-800'
                    : newCall.outcome === 'Lead Qualified'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {newCall.outcome}
                </span>
                <span className={`text-xs ${
                  newCall.sentiment === 'Positive' 
                    ? 'text-green-600'
                    : newCall.sentiment === 'Negative'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}>
                  {newCall.sentiment}
                </span>
              </div>
            </div>
            
            <div className="mt-3 flex space-x-2">
              <button className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
                <Eye className="h-3 w-3" />
                <span>View Details</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}