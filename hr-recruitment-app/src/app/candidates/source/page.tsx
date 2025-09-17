'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import SourceCandidatesDialog from '@/components/SourceCandidatesDialog'
import { Search, Target, Users, Plus, Sparkles } from 'lucide-react'

interface Job {
  id: string
  title: string
  companyName: string
  location: string
  mode: string
}

export default function SourceCandidatesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()

  const handleOpenDialog = () => {
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    // After closing the form, navigate to Candidates tab
    router.push('/candidates')
  }

  const handleSourcingInitiated = () => {
    // Optionally refresh data or show success message
    console.log('Sourcing initiated successfully')
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Search className="w-8 h-8 text-indigo-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Source Candidates</h1>
            </div>
            <p className="text-gray-600">
              Initiate candidate sourcing for specific job positions with targeted criteria using LinkedIn
            </p>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="p-8 text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">LinkedIn Candidate Sourcing</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Use our advanced LinkedIn sourcing process flow to find and engage with qualified candidates for your job openings.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                  <Target className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-blue-900 mb-2">Select Job</h3>
                  <p className="text-sm text-gray-600">Choose from your existing job postings to target specific roles</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-100">
                  <Users className="w-8 h-8 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-900 mb-2">Set Quantity</h3>
                  <p className="text-sm text-gray-600">Specify how many candidates you want to source from LinkedIn</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-100">
                  <Search className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-purple-900 mb-2">Automated Sourcing</h3>
                  <p className="text-sm text-gray-600">Let our process flow find and engage candidates automatically</p>
                </div>
              </div>

              <button
                onClick={handleOpenDialog}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg hover:from-purple-700 hover:to-pink-700 flex items-center mx-auto transition-all shadow-lg hover:shadow-xl font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Start LinkedIn Sourcing
              </button>
            </div>
          </div>

          {/* Info Panel */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">About Candidate Sourcing</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    This feature helps you initiate targeted candidate sourcing for specific job positions. 
                    The system will use the provided criteria to identify and reach out to potential candidates 
                    through various channels including LinkedIn, job boards, and professional networks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Source Candidates Dialog */}
      <SourceCandidatesDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSourcingInitiated={handleSourcingInitiated}
      />
    </Layout>
  )
}
