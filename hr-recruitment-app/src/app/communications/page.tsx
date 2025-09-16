'use client'

import { useState, useEffect } from 'react'
import CommunicationInterface from '@/components/CommunicationInterface'
import Sidebar from '@/components/Sidebar'

interface Candidate {
  id: string
  candidateName: string
  email: string
  phoneNumber: string
  currentJobTitle: string
  currentEmployer: string
  overallMessages: unknown[]
  linkedinMessages: number
  emailMessages: number
  lastContactedDate: string
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
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch candidates with their overall_messages from the API
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await fetch('/api/candidates-candidatestable')
        const data = await response.json()
        
        if (data.success) {
          setCandidates(data.candidates)
        }
      } catch (error) {
        console.error('Error fetching candidates:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCandidates()
  }, [])

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <CommunicationInterface 
          candidates={candidates}
          loading={loading}
        />
      </div>
    </div>
  )
}
