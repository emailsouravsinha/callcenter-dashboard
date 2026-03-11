import { Plus, Download, Settings, AlertTriangle } from 'lucide-react'

export function QuickActions() {
  return (
    <div className="flex items-center space-x-3">
      {/* Alert for unresolved calls */}
      <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <span className="text-sm text-yellow-800">23 calls need review</span>
      </div>

      {/* Action buttons */}
      <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
        <Download className="h-4 w-4" />
        <span className="text-sm font-medium">Export Data</span>
      </button>
      
      <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
        <Settings className="h-4 w-4" />
        <span className="text-sm font-medium">AI Settings</span>
      </button>
      
      <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        <Plus className="h-4 w-4" />
        <span className="text-sm font-medium">Add Contact</span>
      </button>
    </div>
  )
}