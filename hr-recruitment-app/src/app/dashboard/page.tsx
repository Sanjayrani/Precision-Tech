'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { Calendar, Users, Briefcase, TrendingUp, Plus } from 'lucide-react'

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
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">TalentFlow Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
              </div>
            </div>
          </div>
        </header>

      <main className="max-w-7xl mx-auto py-8 px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Jobs</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stats.totalJobs}</dd>
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
                    <dd className="text-2xl font-bold text-gray-900">{stats.totalCandidates}</dd>
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
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Today&apos;s Interviews</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stats.todayInterviews}</dd>
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
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Selected</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stats.selectedCandidates}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Users className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Rejected</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stats.rejectedCandidates}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Jobs */}
          <div className="bg-white shadow-lg rounded-xl border border-gray-100">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Active Jobs</h3>
                <Link
                  href="/jobs"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  View all →
                </Link>
              </div>
              <div className="space-y-4">
                {jobs.length > 0 ? (
                  jobs.map((job) => (
                    <div key={job.id} className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-semibold text-gray-900">{job.title}</h4>
                          <p className="text-sm text-gray-600 font-medium">{job.companyName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {job.location} • {job.mode} • Posted {formatDate(job.postedDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-indigo-600">
                            {job._count?.candidates || 0}
                          </span>
                          <p className="text-xs text-gray-500">candidates</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="text-gray-500 mt-2">No active jobs found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Today's Interviews */}
          <div className="bg-white shadow-lg rounded-xl border border-gray-100">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Today&apos;s Interviews</h3>
                <Link
                  href="/candidates"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  View all candidates →
                </Link>
              </div>
              <div className="space-y-4">
                {todayInterviews.length > 0 ? (
                  todayInterviews.map((candidate) => (
                    <div key={candidate.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-semibold text-gray-900">{candidate.candidateName}</h4>
                          <p className="text-sm text-gray-600 font-medium">{candidate.job.title} at {candidate.job.companyName}</p>
                          <p className="text-xs text-gray-500 mt-1">{candidate.email}</p>
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
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="text-gray-500 mt-2">No interviews scheduled for today</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white shadow-lg rounded-xl border border-gray-100">
          <div className="px-6 py-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link
                href="/jobs/new"
                className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 hover:from-indigo-100 hover:to-purple-100 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                    <Plus className="h-5 w-5 text-indigo-600" />
                  </div>
                  <span className="text-sm font-semibold text-indigo-900">Add New Job</span>
                </div>
              </Link>
              <Link
                href="/candidates/new"
                className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 hover:from-green-100 hover:to-emerald-100 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-sm font-semibold text-green-900">Add Candidate</span>
                </div>
              </Link>
              <Link
                href="/jobs"
                className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 hover:from-blue-100 hover:to-cyan-100 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-blue-900">Manage Jobs</span>
                </div>
              </Link>
              <Link
                href="/candidates"
                className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 hover:from-purple-100 hover:to-pink-100 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-semibold text-purple-900">View Candidates</span>
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
