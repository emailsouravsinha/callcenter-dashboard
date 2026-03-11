import { Eye, Download, Phone, Clock, User, MessageSquare } from 'lucide-react'

// Mock data - will be replaced with real database data
const recentCalls = [
  {
    id: 1,
    caller: 'Sarah Johnson',
    phone: '+1 (555) 123-4567',
    time: '2 minutes ago',
    duration: '4:32',
    outcome: 'Appointment Booked',
    sentiment: 'Positive',
    intent: 'Schedule Service',
    status: 'completed',
  },
  {
    id: 2,
    caller: 'Mike Chen',
    phone: '+1 (555) 987-6543',
    time: '8 minutes ago',
    duration: '2:15',
    outcome: 'Information Only',
    sentiment: 'Neutral',
    intent: 'Product Inquiry',
    status: 'completed',
  },
  {
    id: 3,
    caller: 'Unknown Caller',
    phone: '+1 (555) 456-7890',
    time: '15 minutes ago',
    duration: '0:45',
    outcome: 'Missed Call',
    sentiment: 'N/A',
    intent: 'Unknown',
    status: 'missed',
  },
  {
    id: 4,
    caller: 'Jennifer Davis',
    phone: '+1 (555) 234-5678',
    time: '23 minutes ago',
    duration: '6:18',
    outcome: 'Lead Qualified',
    sentiment: 'Positive',
    intent: 'Sales Inquiry',
    status: 'completed',
  },
  {
    id: 5,
    caller: 'Robert Wilson',
    phone: '+1 (555) 345-6789',
    time: '31 minutes ago',
    duration: '3:42',
    outcome: 'Complaint Resolved',
    sentiment: 'Negative → Positive',
    intent: 'Support Request',
    status: 'completed',
  },
]

const getOutcomeColor = (outcome: string) => {
  switch (outcome) {
    case 'Appointment Booked':
      return 'bg-green-100 text-green-800'
    case 'Lead Qualified':
      return 'bg-blue-100 text-blue-800'
    case 'Information Only':
      return 'bg-gray-100 text-gray-800'
    case 'Missed Call':
      return 'bg-red-100 text-red-800'
    case 'Complaint Resolved':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getSentimentColor = (sentiment: string) => {
  if (sentiment.includes('Positive')) return 'text-green-600'
  if (sentiment.includes('Negative')) return 'text-red-600'
  return 'text-gray-600'
}

export function RecentCallsTable() {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Calls</h3>
            <p className="text-sm text-gray-500 mt-1">Latest customer interactions and AI responses</p>
          </div>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All Activity →
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Caller
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time & Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Outcome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Intent & Sentiment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recentCalls.map((call) => (
              <tr key={call.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${
                      call.status === 'missed' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {call.status === 'missed' ? (
                        <Phone className="h-4 w-4 text-red-600" />
                      ) : (
                        <User className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{call.caller}</div>
                      <div className="text-sm text-gray-500">{call.phone}</div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <div>
                      <div>{call.time}</div>
                      <div className="text-gray-500">{call.duration}</div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOutcomeColor(call.outcome)}`}>
                    {call.outcome}
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="text-gray-900">{call.intent}</div>
                    <div className={`${getSentimentColor(call.sentiment)}`}>{call.sentiment}</div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900" title="View Transcript">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900" title="View Details">
                      <MessageSquare className="h-4 w-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900" title="Download">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}