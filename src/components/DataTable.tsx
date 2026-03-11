import { Eye, Edit, Trash2 } from 'lucide-react'

// Mock data - will be replaced with real database data
const tableData = [
  {
    id: 1,
    client: 'TechCorp Solutions',
    project: 'Legacy System Migration',
    status: 'In Progress',
    revenue: 45000,
    startDate: '2024-01-15',
    completion: 65,
  },
  {
    id: 2,
    client: 'Global Manufacturing Inc',
    project: 'AI Process Automation',
    status: 'Completed',
    revenue: 38000,
    startDate: '2023-11-20',
    completion: 100,
  },
  {
    id: 3,
    client: 'FinanceFlow Ltd',
    project: 'System Integration',
    status: 'Planning',
    revenue: 52000,
    startDate: '2024-03-01',
    completion: 15,
  },
  {
    id: 4,
    client: 'RetailChain Corp',
    project: 'Corporate AI Implementation',
    status: 'In Progress',
    revenue: 41000,
    startDate: '2024-02-10',
    completion: 40,
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'bg-green-100 text-green-800'
    case 'In Progress':
      return 'bg-blue-100 text-blue-800'
    case 'Planning':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function DataTable() {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
        <p className="text-sm text-gray-500 mt-1">Overview of current and completed client projects</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client & Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{row.client}</div>
                    <div className="text-sm text-gray-500">{row.project}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(row.status)}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${row.revenue.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${row.completion}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{row.completion}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(row.startDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
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