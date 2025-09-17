'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '@/components/Layout'
import CandidateDetailsDialog from '@/components/CandidateDetailsDialog'
import { Search, Plus, Mail, Phone, Calendar, MapPin, Star } from 'lucide-react'

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

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchCandidates()
  }, [])

  const fetchCandidates = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/candidates-candidatestable`)
      if (response.ok) {
        const data = await response.json()
        setCandidates(data.candidates || [])
        setTotalPages(Math.ceil((data.totalCount || 0) / 10))
      }
    } catch (error) {
      console.error('Error fetching candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter candidates based on search term and status
  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = !search || (
      candidate.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      candidate.email.toLowerCase().includes(search.toLowerCase()) ||
      candidate.skills.toLowerCase().includes(search.toLowerCase()) ||
      candidate.currentJobTitle?.toLowerCase().includes(search.toLowerCase()) ||
      candidate.currentEmployer?.toLowerCase().includes(search.toLowerCase())
    )
    
    const matchesStatus = !statusFilter || candidate.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Paginate filtered candidates
  const candidatesPerPage = 10
  const startIndex = (page - 1) * candidatesPerPage
  const endIndex = startIndex + candidatesPerPage
  const paginatedCandidates = filteredCandidates.slice(startIndex, endIndex)
  const totalFilteredPages = Math.ceil(filteredCandidates.length / candidatesPerPage)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const handleCandidateClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedCandidate(null)
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
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search candidates by name, email, or skills..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Sourced">Sourced</option>
              <option value="Interview Scheduled">Interview Scheduled</option>
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
            </select>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
            >
              Search
            </button>
          </form>
        </div>

        {/* Candidates List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg">Loading candidates...</div>
          </div>
        ) : (
          <>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {paginatedCandidates.map((candidate) => (
                  <li key={candidate.id}>
                    <button 
                      onClick={() => handleCandidateClick(candidate)}
                      className="block w-full text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium text-indigo-600 truncate">
                                {candidate.candidateName}
                              </h3>
                              <div className="ml-2 flex items-center space-x-2">
                                <div className={`flex items-center ${getScoreColor(candidate.candidateScore)}`}>
                                  <Star className="w-4 h-4 mr-1" />
                                  <span className="text-sm font-medium">{candidate.candidateScore}/100</span>
                                </div>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(candidate.status)}`}>
                                  {candidate.status}
                                </span>
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
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pagination */}
            {totalFilteredPages > 1 && (
              <div className="mt-6 flex justify-center">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalFilteredPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pageNum
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setPage(Math.min(totalFilteredPages, page + 1))}
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
                  {search || statusFilter ? 'No candidates found matching your criteria.' : 'No candidates added yet.'}
                </div>
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
      />
    </Layout>
  )
}
