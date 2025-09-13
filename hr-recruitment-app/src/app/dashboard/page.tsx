'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { Calendar, Users, Briefcase, TrendingUp, Plus, LogOut } from 'lucide-react'

interface Job {
  id: string
  title: string
  companyName: string
  location: string
  mode: string
  postedDate: string
  _count?: {
    candidates: number
  }
}

interface Candidate {
  id: string
  candidateName: string
  email: string
  interviewDate: string | null
  status: string
  job: {
    title: string
    companyName: string
  }
}

interface DashboardStats {
  totalJobs: number
  totalCandidates: number
  todayInterviews: number
  selectedCandidates: number
  rejectedCandidates: number
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [todayInterviews, setTodayInterviews] = useState<Candidate[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    totalCandidates: 0,
    todayInterviews: 0,
    selectedCandidates: 0,
    rejectedCandidates: 0
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [jobsRes, interviewsRes, statsRes] = await Promise.all([
        fetch('/api/jobs?limit=5'),
        fetch('/api/candidates/today-interviews'),
        fetch('/api/dashboard/stats')
      ])

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json()
        setJobs(jobsData.jobs || [])
      }

      if (interviewsRes.ok) {
        const interviewsData = await interviewsRes.json()
        setTodayInterviews(interviewsData.candidates || [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">TalentFlow Dashboard</h1>
                <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Briefcase className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Jobs</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalJobs}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Candidates</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalCandidates}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Today's Interviews</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.todayInterviews}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Selected</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.selectedCandidates}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Rejected</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.rejectedCandidates}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Jobs */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Active Jobs</h3>
                <Link
                  href="/jobs"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {jobs.length > 0 ? (
                  jobs.map((job) => (
                    <div key={job.id} className="border-l-4 border-indigo-400 pl-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{job.title}</h4>
                          <p className="text-sm text-gray-500">{job.companyName}</p>
                          <p className="text-xs text-gray-400">
                            {job.location} • {job.mode} • Posted {formatDate(job.postedDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {job._count?.candidates || 0}
                          </span>
                          <p className="text-xs text-gray-500">candidates</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No active jobs found</p>
                )}
              </div>
            </div>
          </div>

          {/* Today's Interviews */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Today's Interviews</h3>
                <Link
                  href="/candidates"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  View all candidates
                </Link>
              </div>
              <div className="space-y-4">
                {todayInterviews.length > 0 ? (
                  todayInterviews.map((candidate) => (
                    <div key={candidate.id} className="border-l-4 border-blue-400 pl-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{candidate.candidateName}</h4>
                          <p className="text-sm text-gray-500">{candidate.job.title} at {candidate.job.companyName}</p>
                          <p className="text-xs text-gray-400">{candidate.email}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            candidate.status === 'selected' 
                              ? 'bg-green-100 text-green-800'
                              : candidate.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {candidate.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No interviews scheduled for today</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/jobs/new"
                className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 hover:bg-indigo-100 transition-colors"
              >
                <div className="flex items-center">
                  <Plus className="h-6 w-6 text-indigo-600 mr-3" />
                  <span className="text-sm font-medium text-indigo-900">Add New Job</span>
                </div>
              </Link>
              <Link
                href="/candidates/new"
                className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center">
                  <Users className="h-6 w-6 text-green-600 mr-3" />
                  <span className="text-sm font-medium text-green-900">Add Candidate</span>
                </div>
              </Link>
              <Link
                href="/jobs"
                className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center">
                  <Briefcase className="h-6 w-6 text-blue-600 mr-3" />
                  <span className="text-sm font-medium text-blue-900">Manage Jobs</span>
                </div>
              </Link>
              <Link
                href="/candidates"
                className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-center">
                  <Calendar className="h-6 w-6 text-purple-600 mr-3" />
                  <span className="text-sm font-medium text-purple-900">View Candidates</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
      </div>
    </Layout>
  )
}
