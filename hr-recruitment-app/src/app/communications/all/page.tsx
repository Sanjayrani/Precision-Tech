'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import CommunicationInterface from '@/components/CommunicationInterface'
import Sidebar from '@/components/Sidebar'

interface OverallMessage {
  content: string
  timestamp: string
  sender: 'Recruiter' | 'Candidate'
}

// For handling a single string in overallMessages
type OverallMessages = OverallMessage[] | string

interface Candidate {
  id: string
  candidateName: string
  email: string
  phoneNumber: string
  currentJobTitle: string
  currentEmployer: string
  overallMessages: OverallMessages
  linkedinMessages: number
  emailMessages: number
  lastContactedDate: string
  createdAt: string
  jobId: string
  linkedinMessage: string
  subject: string
  replyStatus: string
  jobsMapped: string
  hasMessages: boolean
  messageCount: number
  job: {
    id: string
    title: string
    companyName: string
  }
}

export default function AllCommunicationsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading all candidates...</p>
          </div>
        </div>
      </div>
    }>
      <AllCommunicationsPageContent />
    </Suspense>
  )
}

function AllCommunicationsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [stats, setStats] = useState<{totalCandidates: number, withMessages: number, withoutMessages: number} | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Initialize from URL
    const initialPage = parseInt(searchParams.get('page') || '1', 10)
    const safePage = Number.isNaN(initialPage) || initialPage < 1 ? 1 : initialPage
    setPage(safePage)
    const q = searchParams.get('search') || ''
    setSearchQuery(q)
    fetchCandidates(safePage, q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep URL in sync when page changes
  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set('page', String(page))
    router.replace(`?${params.toString()}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // React to search query changes in URL (set by child input)
  useEffect(() => {
    const q = searchParams.get('search') || ''
    // If query changed, reset to page 1 and fetch
    setSearchQuery(q)
    fetchCandidates(1, q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const fetchCandidates = async (p: number, search = '') => {
    try {
      setLoading(true)
      setCandidates([])
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : ''
      const response = await fetch(`/api/communications/candidates-all?page=${p}&limit=20${searchParam}`)
      if (response.ok) {
        const data = await response.json()
        console.log('All Candidates API Response:', { 
          page: p, 
          candidatesCount: data.candidates?.length, 
          totalCount: data.totalCount,
          limit: data.limit,
          stats: data.stats,
          search
        })
        // Use the server-provided page of candidates as-is
        const pageCandidates = data.candidates || []
        setCandidates(pageCandidates)
        // Use server-reported totalCount and our limit to compute total pages
        const serverLimit = data.limit || 10
        setPageSize(serverLimit)
        const total = data.totalCount || 0
        const calculatedPages = Math.ceil(total / serverLimit)
        console.log('Pagination calculation:', { total, serverLimit, calculatedPages })
        setTotalPages(calculatedPages)
        setTotalCount(total)
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error('Error fetching all candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchCandidates(newPage, searchQuery)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPage(1) // Reset to first page on new search
    fetchCandidates(1, query)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Stats Header */}
        {stats && (
          <div className="bg-blue-50 border-b border-blue-200 p-3 flex-shrink-0">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-base font-semibold text-blue-900 mb-2">All Candidates Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-white p-2 rounded-lg border border-blue-200">
                  <div className="text-blue-600 font-medium text-xs">Total Candidates</div>
                  <div className="text-xl font-bold text-blue-900">{stats.totalCandidates}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-green-200">
                  <div className="text-green-600 font-medium text-xs">Candidates Communicated</div>
                  <div className="text-xl font-bold text-green-900">{stats.withMessages}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-orange-200">
                  <div className="text-orange-600 font-medium text-xs">Candidates to be Communicated</div>
                  <div className="text-xl font-bold text-orange-900">{stats.withoutMessages}</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-hidden">
          <CommunicationInterface 
            candidates={candidates}
            loading={loading}
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
          />
        </div>
      </div>
    </div>
  )
}
