'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Target, Users, Sparkles } from 'lucide-react'

interface Job {
  id: string
  title: string
  companyName: string
  location: string
  mode: string
}

interface SourceCandidatesDialogProps {
  isOpen: boolean
  onClose: () => void
  onSourcingInitiated: () => void
}

export default function SourceCandidatesDialog({ isOpen, onClose, onSourcingInitiated }: SourceCandidatesDialogProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fetchingJobs, setFetchingJobs] = useState(false)

  // Fetch jobs when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchJobs()
      setError('')
      setSuccess('')
    }
  }, [isOpen])

  const fetchJobs = async () => {
    try {
      setFetchingJobs(true)
      const response = await fetch('/api/job-jobstable')
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setError('Failed to load jobs')
    } finally {
      setFetchingJobs(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!formRef.current) {
      setError('Form not found')
      setLoading(false)
      return
    }

    try {
      const formData = new FormData(formRef.current)
      const sourcingData = {
        job_title: formData.get('job_title') as string,
        candidates_required: parseInt(formData.get('candidates_required') as string) || 0,
      }

      console.log('Submitting sourcing data:', sourcingData)

      const response = await fetch('/api/source-candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sourcingData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(`Successfully initiated LinkedIn sourcing for ${sourcingData.candidates_required} candidates!`)
        setTimeout(() => {
          onSourcingInitiated()
          onClose()
        }, 1500)
      } else {
        setError(data.error || 'Failed to initiate candidate sourcing')
      }
    } catch (err) {
      setError('An error occurred while initiating sourcing')
      console.error('Error initiating sourcing:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      
      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl transform transition-all">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Start Process Flow</h2>
                  <p className="text-gray-600">LinkedIn Sourcing Record Creator</p>
                  <p className="text-sm text-purple-600 font-medium">Sourcing Record Manager</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            )}


            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              {/* Job Title Selection */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Job Title*
                </h3>
                <p className="text-sm text-gray-600 mb-4">Select the Job Title from the list.</p>
                {fetchingJobs ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <span className="ml-2 text-gray-600">Loading jobs...</span>
                  </div>
                ) : (
                  <select
                    name="job_title"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    defaultValue=""
                  >
                    <option value="">Select An Option</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.title}>
                        {job.title} at {job.companyName} ({job.location})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Candidates Required */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <h3 className="font-semibold text-green-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Candidates Required*
                </h3>
                <p className="text-sm text-gray-600 mb-4">Enter the number of candidates you would like to search from LinkedIn.</p>
                <input
                  type="number"
                  name="candidates_required"
                  required
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  placeholder="Enter number of candidates"
                  defaultValue="0"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || fetchingJobs}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Running...
                    </>
                  ) : (
                    <>Run</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
