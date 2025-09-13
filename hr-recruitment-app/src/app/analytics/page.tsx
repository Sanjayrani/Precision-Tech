'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Briefcase, 
  Calendar,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react'

interface AnalyticsData {
  totalJobs: number
  totalCandidates: number
  activeJobs: number
  selectedCandidates: number
  rejectedCandidates: number
  interviewedCandidates: number
  newCandidates: number
  contactedCandidates: number
  averageTimeToHire: number
  conversionRate: number
  monthlyHires: Array<{
    month: string
    hires: number
  }>
  jobsByStatus: Array<{
    status: string
    count: number
  }>
  candidatesBySource: Array<{
    source: string
    count: number
  }>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalJobs: 0,
    totalCandidates: 0,
    activeJobs: 0,
    selectedCandidates: 0,
    rejectedCandidates: 0,
    interviewedCandidates: 0,
    newCandidates: 0,
    contactedCandidates: 0,
    averageTimeToHire: 0,
    conversionRate: 0,
    monthlyHires: [],
    jobsByStatus: [],
    candidatesBySource: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        // Mock data for demonstration
        setAnalytics({
          totalJobs: 25,
          totalCandidates: 147,
          activeJobs: 18,
          selectedCandidates: 23,
          rejectedCandidates: 45,
          interviewedCandidates: 68,
          newCandidates: 34,
          contactedCandidates: 89,
          averageTimeToHire: 14,
          conversionRate: 15.6,
          monthlyHires: [
            { month: 'Jan', hires: 8 },
            { month: 'Feb', hires: 12 },
            { month: 'Mar', hires: 15 },
            { month: 'Apr', hires: 10 },
            { month: 'May', hires: 18 },
            { month: 'Jun', hires: 23 }
          ],
          jobsByStatus: [
            { status: 'Active', count: 18 },
            { status: 'Filled', count: 7 },
            { status: 'On Hold', count: 3 },
            { status: 'Closed', count: 2 }
          ],
          candidatesBySource: [
            { source: 'LinkedIn', count: 45 },
            { source: 'Job Boards', count: 38 },
            { source: 'Referrals', count: 28 },
            { source: 'Direct Applications', count: 22 },
            { source: 'Sourcing', count: 14 }
          ]
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">Loading analytics...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Analytics & Insights
                </h1>
                <p className="text-gray-600 mt-1">Track your recruitment performance and metrics</p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-6 lg:px-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <Briefcase className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Jobs</dt>
                      <dd className="text-2xl font-bold text-gray-900">{analytics.totalJobs}</dd>
                      <dd className="text-sm text-green-600">+{analytics.activeJobs} active</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Candidates</dt>
                      <dd className="text-2xl font-bold text-gray-900">{analytics.totalCandidates}</dd>
                      <dd className="text-sm text-green-600">+{analytics.newCandidates} new</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                      <dd className="text-2xl font-bold text-gray-900">{analytics.conversionRate}%</dd>
                      <dd className="text-sm text-gray-500">candidates to hires</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Clock className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Avg. Time to Hire</dt>
                      <dd className="text-2xl font-bold text-gray-900">{analytics.averageTimeToHire}</dd>
                      <dd className="text-sm text-gray-500">days</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Monthly Hires Trend */}
            <div className="bg-white shadow-lg rounded-xl border border-gray-100">
              <div className="px-6 py-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Monthly Hires Trend</h3>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div className="space-y-4">
                  {analytics.monthlyHires.map((item, index) => (
                    <div key={item.month} className="flex items-center">
                      <div className="w-12 text-sm font-medium text-gray-600">{item.month}</div>
                      <div className="flex-1 mx-4">
                        <div className="bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${(item.hires / Math.max(...analytics.monthlyHires.map(m => m.hires))) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-8 text-sm font-semibold text-gray-900">{item.hires}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Candidate Status Distribution */}
            <div className="bg-white shadow-lg rounded-xl border border-gray-100">
              <div className="px-6 py-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Candidate Status</h3>
                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Selected</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{analytics.selectedCandidates}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Interviewed</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{analytics.interviewedCandidates}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Contacted</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{analytics.contactedCandidates}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Rejected</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{analytics.rejectedCandidates}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Job Status Distribution */}
            <div className="bg-white shadow-lg rounded-xl border border-gray-100">
              <div className="px-6 py-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Jobs by Status</h3>
                <div className="space-y-4">
                  {analytics.jobsByStatus.map((item) => (
                    <div key={item.status} className="flex items-center">
                      <div className="w-20 text-sm font-medium text-gray-600">{item.status}</div>
                      <div className="flex-1 mx-4">
                        <div className="bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-300 ${
                              item.status === 'Active' ? 'bg-green-500' :
                              item.status === 'Filled' ? 'bg-blue-500' :
                              item.status === 'On Hold' ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`}
                            style={{ width: `${(item.count / Math.max(...analytics.jobsByStatus.map(j => j.count))) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-8 text-sm font-semibold text-gray-900">{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Candidate Sources */}
            <div className="bg-white shadow-lg rounded-xl border border-gray-100">
              <div className="px-6 py-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Candidate Sources</h3>
                <div className="space-y-4">
                  {analytics.candidatesBySource.map((item, index) => (
                    <div key={item.source} className="flex items-center">
                      <div className="w-24 text-sm font-medium text-gray-600 truncate">{item.source}</div>
                      <div className="flex-1 mx-4">
                        <div className="bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-300 ${
                              index === 0 ? 'bg-indigo-500' :
                              index === 1 ? 'bg-purple-500' :
                              index === 2 ? 'bg-blue-500' :
                              index === 3 ? 'bg-green-500' :
                              'bg-orange-500'
                            }`}
                            style={{ width: `${(item.count / Math.max(...analytics.candidatesBySource.map(c => c.count))) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-8 text-sm font-semibold text-gray-900">{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  )
}
