'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Layout from '@/components/Layout'
import CreateJobDialog from '@/components/CreateJobDialog'
import SourceCandidatesDialog from '@/components/SourceCandidatesDialog'
import { Calendar, Users, Briefcase, TrendingUp, Plus, Search } from 'lucide-react'


interface Job {
  id: string
  title: string
  companyName: string
  location: string
  mode: string
  postedDate: string
  jobStatus: string
  _count?: {
    candidates: number
  }
}

interface Candidate {
  id: string
  candidateName: string
  email: string
  status: string
  interviewDate: string | null
  meetingDate?: string | null
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
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Hireverse Dashboard</h1>
                  <p className="text-gray-600 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto py-8 px-6 lg:px-8">
            {/* Initial Loading State */}
            <div className="space-y-8">
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Initializing Dashboard</h3>
                <p className="text-gray-600 mb-8">Setting up your recruitment workspace...</p>
                <div className="grid grid-cols-1 gap-4 text-sm text-gray-500 max-w-lg mx-auto">
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                    Connecting to recruitment database
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                    Loading dashboard components
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                    Preparing analytics dashboard
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </Layout>
    }>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const [activeJobs, setActiveJobs] = useState<Job[]>([])
  const [scheduledInterviews, setScheduledInterviews] = useState<Candidate[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    totalCandidates: 0,
    todayInterviews: 0,
    selectedCandidates: 0,
    rejectedCandidates: 0
  })
  const [loading, setLoading] = useState(true)
  const [isCreateJobDialogOpen, setIsCreateJobDialogOpen] = useState(false)
  const [isSourceCandidatesDialogOpen, setIsSourceCandidatesDialogOpen] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, statsRes, interviewsRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/interviews')
      ])

      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json()
        console.log('Dashboard data received:', dashboardData)
        if (dashboardData.success) {
          setStats(prevStats => ({
            ...prevStats,
            totalJobs: dashboardData.data.totalJobs
          }))
          // Set active jobs (already filtered by API)
          setActiveJobs(dashboardData.data.activeJobs || [])
        }
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        if (statsData.success) {
          setStats(prevStats => ({
            ...prevStats,
            totalCandidates: statsData.totalCandidates,
            todayInterviews: statsData.todayInterviews,
            selectedCandidates: statsData.selectedCandidates,
            rejectedCandidates: statsData.rejectedCandidates
          }))
        }
      }

      if (interviewsRes.ok) {
        const interviewsData = await interviewsRes.json()
        console.log('Interview scheduled candidates data received:', interviewsData)
        if (interviewsData.success) {
          const meetingScheduledCandidates = interviewsData.candidates || []
          console.log('Meeting Scheduled candidates:', meetingScheduledCandidates.map((c: any) => ({ 
            name: c.candidateName, 
            status: c.status, 
            interviewDate: c.interviewDate,
            meetingDate: c.meetingDate 
          })))
          
          setScheduledInterviews(meetingScheduledCandidates)
          
          // Update stats with the actual count of scheduled interviews
          setStats(prevStats => ({
            ...prevStats,
            todayInterviews: meetingScheduledCandidates.length
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    // If parsing fails, show the raw value (e.g., meeting_date already human-formatted)
    if (isNaN(d.getTime())) return String(dateString)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  const handleJobCreated = () => {
    // Refresh dashboard data when a new job is created
    fetchDashboardData()
  }

  const handleOpenCreateJobDialog = () => {
    setIsCreateJobDialogOpen(true)
  }

  const handleCloseCreateJobDialog = () => {
    setIsCreateJobDialogOpen(false)
  }

  const handleOpenSourceCandidatesDialog = () => {
    setIsSourceCandidatesDialogOpen(true)
  }

  const handleCloseSourceCandidatesDialog = () => {
    setIsSourceCandidatesDialogOpen(false)
  }

  const handleSourcingInitiated = (jobTitle?: string) => {
    // For multiple jobs, create a sourcing jobs array
    const existingJobs = sessionStorage.getItem('sourcingJobs')
    const jobs = existingJobs ? JSON.parse(existingJobs) : []
    
    // Add new job to the list
    const newJob = {
      id: Date.now().toString(),
      jobTitle: jobTitle || 'Product Manager',
      startTime: Date.now(),
      totalTime: Math.floor(Math.random() * (7 * 60 - 5 * 60 + 1)) + 5 * 60, // 5-7 minutes
      isCompleted: false
    }
    
    jobs.push(newJob)
    sessionStorage.setItem('sourcingJobs', JSON.stringify(jobs))
    
    // Refresh dashboard data when sourcing is initiated
    fetchDashboardData()
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Hireverse Dashboard</h1>
                  <p className="text-gray-600 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto py-8 px-6 lg:px-8">
            {/* Loading State */}
            <div className="space-y-8">
              {/* Loading Header */}
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Loading Dashboard</h3>
                <p className="text-gray-600 mb-6">Fetching your recruitment data and analytics...</p>
                <div className="grid grid-cols-1 gap-3 text-sm text-gray-500 max-w-md mx-auto">
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                    Retrieving job statistics
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                    Loading candidate data
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                    Preparing interview schedules
                  </div>
                </div>
              </div>

              {/* Stats Cards Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 animate-pulse">
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="p-3 bg-gray-200 rounded-lg">
                            <div className="h-6 w-6 bg-gray-300 rounded"></div>
                          </div>
                        </div>
                        <div className="ml-4 w-0 flex-1">
                          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                          <div className="h-8 bg-gray-200 rounded w-12"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Content Sections Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Jobs Skeleton */}
                <div className="bg-white shadow-lg rounded-xl border border-gray-100 animate-pulse">
                  <div className="px-6 py-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="h-6 bg-gray-200 rounded w-24"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="space-y-4">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="bg-gray-50 border-l-4 border-gray-200 p-4 rounded-r-lg">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Interviews Skeleton */}
                <div className="bg-white shadow-lg rounded-xl border border-gray-100 animate-pulse">
                  <div className="px-6 py-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="h-6 bg-gray-200 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="space-y-4">
                      {[...Array(2)].map((_, index) => (
                        <div key={index} className="bg-gray-50 border-l-4 border-gray-200 p-4 rounded-r-lg">
                          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Skeleton */}
              <div className="bg-white shadow-lg rounded-xl border border-gray-100 animate-pulse">
                <div className="px-6 py-6">
                  <div className="h-6 bg-gray-200 rounded w-24 mb-6"></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center">
                          <div className="p-2 bg-gray-200 rounded-lg mr-3">
                            <div className="h-5 w-5 bg-gray-300 rounded"></div>
                          </div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Hireverse Dashboard</h1>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Jobs</dt>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Interviews Scheduled</dt>
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

        {/* Active Jobs and Interviews Scheduled Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Jobs */}
          <div className="bg-white shadow-lg rounded-xl border border-gray-100">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Active Jobs</h3>
                <Link
                  href="/jobs?activeOnly=1"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  View all →
                </Link>
              </div>
              <div className="space-y-4">
                {activeJobs.length > 0 ? (
                  activeJobs.map((job) => (
                    <div key={job.id} className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-semibold text-gray-900">{job.title}</h4>
                          <p className="text-sm text-gray-600 font-medium">{job.companyName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {job.location} • {job.mode} • Posted {formatDate(job.postedDate)}
                          </p>
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

          {/* Interviews Scheduled */}
          <div className="bg-white shadow-lg rounded-xl border border-gray-100">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Interviews Scheduled</h3>
                <Link
                  href="/candidates"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  View all →
                </Link>
              </div>
              <div className="space-y-4">
                {scheduledInterviews.length > 0 ? (
                  scheduledInterviews.map((candidate) => (
                    <div key={candidate.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-semibold text-gray-900">{candidate.candidateName}</h4>
                          <p className="text-sm text-gray-600 font-medium">{candidate.job.title} at {candidate.job.companyName}</p>
                          <p className="text-xs text-gray-500 mt-1">{candidate.email}</p>
                          {(candidate.interviewDate || candidate.meetingDate) && (
                            <p className="text-xs text-blue-600 mt-1">
                              Interview: {formatDate(candidate.interviewDate || candidate.meetingDate || "")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="text-gray-500 mt-2">No interviews scheduled</p>
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
               <button
                 onClick={handleOpenCreateJobDialog}
                 className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 hover:from-indigo-100 hover:to-purple-100 transition-all duration-200 shadow-sm hover:shadow-md w-full text-left"
               >
                 <div className="flex items-center">
                   <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                     <Plus className="h-5 w-5 text-indigo-600" />
                   </div>
                   <span className="text-sm font-semibold text-indigo-900">Add New Job</span>
                 </div>
               </button>
               <button
                 onClick={handleOpenSourceCandidatesDialog}
                 className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 hover:from-purple-100 hover:to-pink-100 transition-all duration-200 shadow-sm hover:shadow-md w-full text-left"
               >
                 <div className="flex items-center">
                   <div className="p-2 bg-purple-100 rounded-lg mr-3">
                     <Search className="h-5 w-5 text-purple-600" />
                   </div>
                   <span className="text-sm font-semibold text-purple-900">Start Sourcing</span>
                 </div>
               </button>
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

       {/* Create Job Dialog */}
       <CreateJobDialog
         isOpen={isCreateJobDialogOpen}
         onClose={handleCloseCreateJobDialog}
         onJobCreated={handleJobCreated}
       />

       {/* Source Candidates Dialog */}
       <SourceCandidatesDialog
         isOpen={isSourceCandidatesDialogOpen}
         onClose={handleCloseSourceCandidatesDialog}
         onSourcingInitiated={handleSourcingInitiated}
       />
     </Layout>
   )
 }
