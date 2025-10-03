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
  job: {
    id: string
    title: string
    companyName: string
  }
}

export default function CommunicationsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading communications...</p>
          </div>
        </div>
      </div>
    }>
      <CommunicationsPageContent />
    </Suspense>
  )
}

function CommunicationsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    // Initialize from URL
    const initialPage = parseInt(searchParams.get('page') || '1', 10)
    const safePage = Number.isNaN(initialPage) || initialPage < 1 ? 1 : initialPage
    setPage(safePage)
    fetchCandidates(safePage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep URL in sync when page changes
  useEffect(() => {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set('page', String(page))
    router.replace(`?${params.toString()}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const fetchCandidates = async (p: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/communications/candidates?page=${p}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        console.log('Communication API Response:', { 
          page: p, 
          candidatesCount: data.candidates?.length, 
          totalCount: data.totalCount,
          limit: data.limit 
        })
        // Ensure we only show 10 candidates per page, even if API returns more
        const candidates = data.candidates || []
        const limitedCandidates = candidates.slice(0, 10)
        setCandidates(limitedCandidates)
        // Use server-reported totalCount and our limit to compute total pages
        const serverLimit = data.limit || 10
        const total = data.totalCount || 0
        const calculatedPages = Math.ceil(total / serverLimit)
        console.log('Pagination calculation:', { total, serverLimit, calculatedPages })
        setTotalPages(calculatedPages)
        setTotalCount(total)
      }
    } catch (error) {
      console.error('Error fetching communication candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchCandidates(newPage)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <CommunicationInterface 
          candidates={candidates}
          loading={loading}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  )
}
