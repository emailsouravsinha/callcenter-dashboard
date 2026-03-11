import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react'

// Mock data - will be replaced with real database data
const stats = [
  {
    title: 'Total Revenue',
    value: '$124,500',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
  },
  {
    title: 'Active Users',
    value: '2,847',
    change: '+8.2%',
    trend: 'up',
    icon: Users,
  },
  {
    title: 'Conversion Rate',
    value: '3.24%',
    change: '-2.1%',
    trend: 'down',
    icon: TrendingUp,
  },
  {
    title: 'System Health',
    value: '99.9%',
    change: '+0.1%',
    trend: 'up',
    icon: Activity,
  },
]

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Icon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            
            <div className="mt-4 flex items-center">
              <span className={`text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-2">vs last month</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}