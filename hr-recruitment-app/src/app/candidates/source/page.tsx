'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { Search, Target, Users } from 'lucide-react'

interface Job {
  id: string
  title: string
  companyName: string
  location: string
  mode: string
}

export default function SourceCandidatesPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [formData, setFormData] = useState({
    jobId: '',
    candidateCount: 5,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/candidates/source', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Successfully initiated sourcing for ${formData.candidateCount} candidates!`)
        setFormData({
          jobId: '',
          candidateCount: 5,
        })
      } else {
        setError(data.error || 'Failed to initiate candidate sourcing')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    })
  }

  const selectedJob = jobs.find(job => job.id === formData.jobId)

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
              Initiate candidate sourcing for specific job positions with targeted criteria
            </p>
          </div>

          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
                  {success}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Job Selection */}
                <div className="sm:col-span-2">
                  <label htmlFor="jobId" className="block text-sm font-medium text-gray-700">
                    Select Job Position *
                  </label>
                  <select
                    name="jobId"
                    id="jobId"
                    required
                    className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900"
                    value={formData.jobId}
                    onChange={handleChange}
                  >
                    <option value="">Select a job position to source candidates for</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title} at {job.companyName} ({job.location})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Job Info */}
                {selectedJob && (
                  <div className="sm:col-span-2 bg-indigo-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Target className="w-5 h-5 text-indigo-600 mr-2" />
                      <h3 className="text-lg font-medium text-indigo-900">Selected Position</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Title:</span>
                        <p className="text-gray-900">{selectedJob.title}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Company:</span>
                        <p className="text-gray-900">{selectedJob.companyName}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Location:</span>
                        <p className="text-gray-900">{selectedJob.location}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Candidate Count */}
                <div>
                  <label htmlFor="candidateCount" className="block text-sm font-medium text-gray-700">
                    Number of Candidates to Source *
                  </label>
                  <div className="mt-1 relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      name="candidateCount"
                      id="candidateCount"
                      min="1"
                      max="50"
                      required
                      className="pl-10 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                      placeholder="e.g., 10"
                      value={formData.candidateCount}
                      onChange={handleChange}
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Recommended: 5-20 candidates</p>
                </div>

              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="bg-white py-3 px-6 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.jobId}
                  className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Initiating Sourcing...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Start Sourcing Candidates
                    </>
                  )}
                </button>
              </div>
            </form>
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
    </Layout>
  )
}
