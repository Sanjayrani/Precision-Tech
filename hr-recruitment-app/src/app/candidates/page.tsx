'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Layout from '@/components/Layout'
import SourcingProgressBar from '@/components/SourcingProgressBar'
import SourcingNotification from '@/components/SourcingNotification'
import { Search, Plus, Mail, Phone, Calendar, MapPin, Star } from 'lucide-react'

const CandidateDetailsDialog = dynamic(() => import('@/components/CandidateDetailsDialog'), {
  ssr: false,
  loading: () => null
})

interface Candidate {
  id: string
  candidateName: string
  email: string
  phoneNumber: string
  linkedinUrl: string
  skills: string
  experience: string
  certifications: string
  projects: string
  miscellaneousInformation: string
  candidateScore: number
  scoreDescription: string
  score_breakdown?: string[]
  jobsMapped: string
  currentJobTitle: string
  currentEmployer: string
  openToWork: boolean
  education: string
  endorsements: string
  recommendationsReceived: number
  linkedinInmailMessageStatus: string
  emailStatus: string
  linkedinMessages: number
  emailMessages: number
  overallMessages: number
  followUpCount: number
  candidateLocation: string
  lastContactedDate: string
  providerId: string
  linkedinMessageRead: boolean
  jobId: string
  replyStatus: string
  emailMessageRead: boolean
  linkedinMessage: string
  meetingLink: string
  meetingDate: string
  eventId: string
  emailProviderId: string
  subject: string
  status: string
  stage: string
  interviewDate: string | null
  createdAt: string
  job: {
    id: string
    title: string
    companyName: string
  }
}

function CandidatesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [openInEdit, setOpenInEdit] = useState(false)
  const [showSourcingProgress, setShowSourcingProgress] = useState(false)
  const [showSourcingNotification, setShowSourcingNotification] = useState(false)

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search !== (searchParams.get('search') || '')) {
        setPage(1)
        const params = new URLSearchParams(Array.from(searchParams.entries()))
        params.set('page', '1')
        if (search) params.set('search', search)
        else params.delete('search')
        if (statusFilter) params.set('status', statusFilter)
        else params.delete('status')
        router.replace(`?${params.toString()}`)
        fetchCandidates(1, search, statusFilter)
      }
    }, 400)

    return () => clearTimeout(timeoutId)
  }, [search, statusFilter, router, searchParams])

  useEffect(() => {
    // Initialize from URL
    const initialPage = parseInt(searchParams.get('page') || '1', 10)
    const initialSearch = searchParams.get('search') || ''
    const initialStatus = searchParams.get('status') || ''
    const safePage = Number.isNaN(initialPage) || initialPage < 1 ? 1 : initialPage
    setPage(safePage)
    setSearch(initialSearch)
    setStatusFilter(initialStatus)
    fetchCandidates(safePage, initialSearch, initialStatus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Check for sourcing progress on page load
  useEffect(() => {
    const sourcingInProgress = sessionStorage.getItem('sourcingInProgress')
    const sourcingProgress = sessionStorage.getItem('sourcingProgress')
    const sourcingJobs = sessionStorage.getItem('sourcingJobs')
    
    if (sourcingJobs) {
      // Multiple jobs sourcing - show notification
      setShowSourcingNotification(true)
    } else if (sourcingInProgress === 'true' || sourcingProgress) {
      // Single job sourcing - show progress bar
      setShowSourcingProgress(true)
    }
    
    // Clear the flag after showing progress
    sessionStorage.removeItem('sourcingInProgress')
  }, [])

  // Keep URL in sync when page changes
  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set('page', String(page))
    router.replace(`?${params.toString()}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const fetchCandidates = async (p: number, searchQuery?: string, statusQuery?: string) => {
    try {
      setLoading(true)
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
      const statusParam = statusQuery ? `&status=${encodeURIComponent(statusQuery)}` : ''
      const response = await fetch(`/api/candidates-candidatestable?page=${p}&limit=10${searchParam}${statusParam}`)
      if (response.ok) {
        const data = await response.json()
        console.log('API Response:', { 
          page: p, 
          candidatesCount: data.candidates?.length, 
          totalCount: data.totalCount,
          limit: data.limit,
          searchQuery,
          statusQuery
        })
        setCandidates(data.candidates || [])
        setTotalCount(data.totalCount || 0)
        // Use server-reported totalCount and our limit to compute total pages
        const serverLimit = data.limit || 10
        const total = data.totalCount || 0
        const calculatedPages = Math.ceil(total / serverLimit)
        console.log('Pagination calculation:', { total, serverLimit, calculatedPages })
        setTotalPages(calculatedPages)
      }
    } catch (error) {
      console.error('Error fetching candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  // Normalize status labels so that "Meeting Scheduled" is treated as "Interview Scheduled"
  function normalizeStatus(status: string) {
    if (!status) return status
    const s = status.trim()
    if (s === 'Meeting Scheduled') return 'Interview Scheduled'
    return s
  }

  // Server-side pagination already applied; just use current list
  const paginatedCandidates = candidates
  const totalFilteredPages = totalPages


  const handleCandidateClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setOpenInEdit(false)
    setIsDialogOpen(true)
  }

  const handleSaveCandidate = async (updated: Candidate) => {
    try {
      console.log("Triggering candidate-update flow:", updated)
      const response = await fetch('/api/candidate-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updated.id,
          candidateName: updated.candidateName,
          email: updated.email,
          phoneNumber: updated.phoneNumber,
          linkedinUrl: updated.linkedinUrl,
          candidateLocation: updated.candidateLocation,
          status: updated.status,
          stage: updated.stage,
          interviewDate: updated.interviewDate,
          currentJobTitle: updated.currentJobTitle,
          currentEmployer: updated.currentEmployer,
          skills: updated.skills,
          experience: updated.experience,
          education: updated.education,
          projects: updated.projects,
          certifications: updated.certifications,
          endorsements: updated.endorsements,
          openToWork: updated.openToWork,
          jobId: updated.job?.id,
        })
      })

      if (response.ok) {
        // Optimistically update list and close dialog without popups
        setCandidates(prev => prev.map(c => c.id === updated.id ? updated : c))
        setIsDialogOpen(false)
        setSelectedCandidate(null)
        setOpenInEdit(false)
        // Refresh to ensure latest data
        fetchCandidates(page, search, statusFilter)
      } else {
        const errorText = await response.text()
        console.error('candidate-update failed:', errorText)
      }
    } catch (error) {
      console.error('Error calling candidate-update:', error)
    }
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedCandidate(null)
  }

  const handleSourcingComplete = () => {
    setShowSourcingProgress(false)
    // Refresh candidates list to show new candidates
    fetchCandidates(page, search, statusFilter)
  }

  const handleNotificationComplete = () => {
    setShowSourcingNotification(false)
    // Refresh candidates list to show new candidates
    fetchCandidates(page, search, statusFilter)
  }

  const handleNotificationDismiss = () => {
    setShowSourcingNotification(false)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    const raw = String(dateString).trim()
    // If already D/M/Y or D-M-Y string, normalize to DD/MM/YYYY and show
    const m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
    if (m) {
      const dd = m[1].padStart(2, '0')
      const mm = m[2].padStart(2, '0')
      const yyyy = m[3].length === 2 ? (parseInt(m[3], 10) < 50 ? `20${m[3]}` : `19${m[3]}`) : m[3]
      return `${dd}/${mm}/${yyyy}`
    }
    // Otherwise try parsing and rendering as DD/MM/YYYY
    const d = new Date(raw)
    if (isNaN(d.getTime())) return raw
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Format meeting/interview date like: "September 17th, 3:00 PM IST"
  const formatMeetingIST = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    const d = new Date(dateString)
    // If parsing fails (e.g., input already formatted like "September 17th, 3:00 PM IST"), show it as-is
    if (isNaN(d.getTime())) return String(dateString)
    const tz = 'Asia/Kolkata'
    const month = d.toLocaleString('en-US', { timeZone: tz, month: 'long' })
    const dayStr = d.toLocaleString('en-US', { timeZone: tz, day: '2-digit' })
    const day = parseInt(dayStr, 10)
    const suffix = (n: number) => {
      const j = n % 10, k = n % 100
      if (j === 1 && k !== 11) return 'st'
      if (j === 2 && k !== 12) return 'nd'
      if (j === 3 && k !== 13) return 'rd'
      return 'th'
    }
    const time = d.toLocaleString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true })
    return `${month} ${day}${suffix(day)}, ${time} IST`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Selected':
        return 'bg-green-100 text-green-800'
      case 'Rejected':
        return 'bg-red-100 text-red-800'
      case 'Interview Scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'Shortlisted':
        return 'bg-indigo-100 text-indigo-800'
      case 'Sourced':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Layout>
      {/* Sourcing Notification for multiple jobs */}
      <SourcingNotification 
        isVisible={showSourcingNotification}
        onComplete={handleNotificationComplete}
        onDismiss={handleNotificationDismiss}
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Candidate Management</h1>
                <p className="text-gray-600">Track and manage all your candidates</p>
              </div>
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sourcing Progress Bar */}
        {showSourcingProgress && (
          <div className="mb-6">
            <SourcingProgressBar 
              isVisible={showSourcingProgress}
              onComplete={handleSourcingComplete}
            />
          </div>
        )}
        
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search candidates by name, email, or skills..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        {!loading && (search || statusFilter) && (
          <div className="mb-4 text-sm text-gray-600">
            {search ? `Found ${totalCount} candidates matching "${search}"` : `Showing ${totalCount} candidates`}
            {statusFilter && ` with status "${statusFilter}"`}
          </div>
        )}

        {/* Candidates List */}
        {loading ? (
          <div className="space-y-6">
            {/* Loading Header */}
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mb-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Candidates</h3>
              <p className="text-sm text-gray-600">Fetching candidate data from the database...</p>
            </div>
            
            {/* Skeleton Loaders */}
            {[...Array(5)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                          <div className="flex space-x-2">
                            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                          </div>
                        </div>
                        <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
                      </div>
                    </div>
                    
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex sm:space-x-6">
                        <div className="flex items-center mb-2 sm:mb-0">
                          <div className="h-4 w-4 bg-gray-200 rounded mr-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-40"></div>
                        </div>
                        <div className="flex items-center mb-2 sm:mb-0">
                          <div className="h-4 w-4 bg-gray-200 rounded mr-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                        <div className="flex items-center">
                          <div className="h-4 w-4 bg-gray-200 rounded mr-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-28"></div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <div className="h-4 w-4 bg-gray-200 rounded mr-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex space-x-4">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {paginatedCandidates.map((candidate) => (
                  <li key={candidate.id}>
                    <div 
                      role="button"
                      onClick={() => handleCandidateClick(candidate)}
                      className="block w-full text-left hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium text-indigo-600 truncate">
                                {candidate.candidateName}
                              </h3>
                              <div className="ml-2 flex items-center space-x-2">
                                {candidate.candidateScore > 0 && (
                                  <div className={`flex items-center ${getScoreColor(candidate.candidateScore)}`}>
                                    <Star className="w-4 h-4 mr-1" />
                                    <span className="text-sm font-medium">{candidate.candidateScore}/100</span>
                                  </div>
                                )}
                                <div className="flex flex-col items-center">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(normalizeStatus(candidate.status))}`}>
                                    {normalizeStatus(candidate.status)}
                                  </span>
                                  {candidate.stage && (
                                    <span className="mt-1 text-xs font-medium text-red-600 text-center block w-full">{candidate.stage}</span>
                                  )}
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedCandidate(candidate); setOpenInEdit(true); setIsDialogOpen(true) }}
                                  className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-indigo-200 text-indigo-700 text-xs font-medium rounded-md bg-indigo-50 hover:bg-indigo-100"
                                >
                                  Edit
                                </button>
                              </div>
                            </div>
                            
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex sm:space-x-6">
                                <p className="flex items-center text-sm text-gray-500">
                                  <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                  {candidate.email}
                                </p>
                                {candidate.phoneNumber && (
                                  <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                    <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                    {candidate.phoneNumber}
                                  </p>
                                )}
                                {candidate.candidateLocation && (
                                  <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                    <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                    {candidate.candidateLocation}
                                  </p>
                                )}
                              </div>
                              {candidate.interviewDate && (
                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                  <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                  <p>Interview: {formatMeetingIST(candidate.interviewDate)}</p>
                                </div>
                              )}
                            </div>

                            <div className="mt-2 flex items-center justify-between">
                              <div>
                                <p className="text-sm font-bold text-black">
                                  Sourced For: {candidate.job.title} at {candidate.job.companyName}
                                </p>
                                {candidate.job?.id && (
                                  <p className="text-xs font-bold text-black mt-1">Job ID: {candidate.job.id}</p>
                                )}
                                {candidate.currentJobTitle && candidate.currentEmployer && (
                                  <p className="text-sm text-gray-500">
                                    Currently: {candidate.currentJobTitle} at {candidate.currentEmployer}
                                  </p>
                                )}
                                <p className="text-sm text-gray-500">
                                  Skills: {typeof candidate.skills === 'string' ? candidate.skills.substring(0, 100) : String(candidate.skills || '').substring(0, 100)}...
                                </p>
                              </div>
                              <div className="text-right text-sm text-gray-500">
                                <p>Follow-ups: {candidate.followUpCount}</p>
                                <p>Added: {formatDate(candidate.createdAt)}</p>
                                {candidate.lastContactedDate && (
                                  <p>Last contact: {formatDate(candidate.lastContactedDate)}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pagination */}
            {totalFilteredPages > 1 && (
              <div className="mt-6 flex justify-center">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => { const next = Math.max(1, page - 1); setPage(next); fetchCandidates(next, search, statusFilter) }}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>

                  {/* Windowed page numbers: show up to 5 at a time, sliding with the current page */}
                  {(() => {
                    const windowSize = 5
                    const start = Math.max(1, Math.min(page - 2, totalFilteredPages - windowSize + 1))
                    const end = Math.min(totalFilteredPages, start + windowSize - 1)
                    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)
                    return pages.map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => { setPage(pageNum); fetchCandidates(pageNum, search, statusFilter) }}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pageNum
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))
                  })()}

                  <button
                    onClick={() => { const next = Math.min(totalFilteredPages, page + 1); setPage(next); fetchCandidates(next, search, statusFilter) }}
                    disabled={page === totalFilteredPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}

            {paginatedCandidates.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  {search || statusFilter ? `No candidates found matching your criteria.` : 'No candidates added yet.'}
                </div>
                {search && (
                  <div className="text-sm text-gray-400 mt-2">
                    Searched for: &quot;{search}&quot;
                  </div>
                )}
                <Link
                  href="/candidates/new"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Candidate
                </Link>
              </div>
            )}
          </>
        )}
      </div>
      </div>

      {/* Candidate Details Dialog */}
      <CandidateDetailsDialog
        candidate={selectedCandidate}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveCandidate}
        initialEdit={openInEdit}
      />
    </Layout>
  )
}

export default function CandidatesPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Candidate Management</h1>
                  <p className="text-gray-600">Track and manage all your candidates</p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Loading State */}
            <div className="space-y-6">
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Loading Candidates</h3>
                <p className="text-gray-600 mb-6">Fetching candidate data from the database...</p>
                <div className="grid grid-cols-1 gap-3 text-sm text-gray-500 max-w-md mx-auto">
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                    Retrieving candidate information
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                    Processing communication data
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                    Preparing candidate list
                  </div>
                </div>
              </div>
              
              {/* Skeleton Loaders */}
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                            <div className="flex space-x-2">
                              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                              <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                            </div>
                          </div>
                          <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
                        </div>
                      </div>
                      
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex sm:space-x-6">
                          <div className="flex items-center mb-2 sm:mb-0">
                            <div className="h-4 w-4 bg-gray-200 rounded mr-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-40"></div>
                          </div>
                          <div className="flex items-center mb-2 sm:mb-0">
                            <div className="h-4 w-4 bg-gray-200 rounded mr-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                          </div>
                          <div className="flex items-center">
                            <div className="h-4 w-4 bg-gray-200 rounded mr-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-28"></div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <div className="h-4 w-4 bg-gray-200 rounded mr-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex space-x-4">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                        <div className="text-right">
                          <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    }>
      <CandidatesPageContent />
    </Suspense>
  )
}
