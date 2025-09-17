'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Briefcase, Building, User } from 'lucide-react'

interface CreateJobDialogProps {
  isOpen: boolean
  onClose: () => void
  onJobCreated: () => void
}

export default function CreateJobDialog({ isOpen, onClose, onJobCreated }: CreateJobDialogProps) {
  // Use refs instead of controlled state
  const formRef = useRef<HTMLFormElement>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Clear form when dialog opens
  useEffect(() => {
    if (isOpen && formRef.current) {
      formRef.current.reset()
      setError('')
      setSuccess('')
    }
  }, [isOpen])

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
      // Get form data using FormData
      const formData = new FormData(formRef.current)
      const jobData = {
        job_title: formData.get('job_title') as string,
        job_description: formData.get('job_description') as string,
        job_location: formData.get('job_location') as string,
        company_name: formData.get('company_name') as string,
        company_description: formData.get('company_description') as string,
        job_mode: formData.get('job_mode') as string,
        recruiter_name: formData.get('recruiter_name') as string,
        recruiter_email: formData.get('recruiter_email') as string,
        recruiter_designation: formData.get('recruiter_designation') as string,
      }

      console.log('Submitting job data:', jobData)

      const response = await fetch('/api/job-create-a-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess('Job created successfully!')
        setTimeout(() => {
          onJobCreated()
          onClose()
        }, 1500)
      } else {
        setError(data.error || 'Failed to create job')
      }
    } catch (err) {
      setError('An error occurred while creating the job')
      console.error('Error creating job:', err)
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
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Job</h2>
                  <p className="text-gray-600">Fill in the details to create a new job posting</p>
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
              {/* Job Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Job Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      id="job_title"
                      name="job_title"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      placeholder="e.g., Senior Software Engineer"
                      defaultValue=""
                    />
                  </div>
                  <div>
                    <label htmlFor="job_mode" className="block text-sm font-medium text-gray-700 mb-2">
                      Job Mode *
                    </label>
                    <select
                      id="job_mode"
                      name="job_mode"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      defaultValue="remote"
                    >
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">Onsite</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="job_description" className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    id="job_description"
                    name="job_description"
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    placeholder="Describe the role, responsibilities, and requirements..."
                    defaultValue=""
                  />
                </div>
              </div>

              {/* Company Information */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <h3 className="font-semibold text-green-900 mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Company Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      id="company_name"
                      name="company_name"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      placeholder="e.g., Precision Tech Corp"
                      defaultValue=""
                    />
                  </div>
                  <div>
                    <label htmlFor="job_location" className="block text-sm font-medium text-gray-700 mb-2">
                      Job Location *
                    </label>
                    <input
                      type="text"
                      id="job_location"
                      name="job_location"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      placeholder="e.g., San Francisco, CA"
                      defaultValue=""
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="company_description" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Description
                  </label>
                  <textarea
                    id="company_description"
                    name="company_description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    placeholder="Brief description of the company..."
                    defaultValue=""
                  />
                </div>
              </div>

              {/* Recruiter Information */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <h3 className="font-semibold text-purple-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Recruiter Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="recruiter_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Recruiter Name *
                    </label>
                    <input
                      type="text"
                      id="recruiter_name"
                      name="recruiter_name"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      placeholder="e.g., John Doe"
                      defaultValue=""
                    />
                  </div>
                  <div>
                    <label htmlFor="recruiter_email" className="block text-sm font-medium text-gray-700 mb-2">
                      Recruiter Email *
                    </label>
                    <input
                      type="email"
                      id="recruiter_email"
                      name="recruiter_email"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      placeholder="e.g., john@company.com"
                      defaultValue=""
                    />
                  </div>
                  <div>
                    <label htmlFor="recruiter_designation" className="block text-sm font-medium text-gray-700 mb-2">
                      Recruiter Designation *
                    </label>
                    <input
                      type="text"
                      id="recruiter_designation"
                      name="recruiter_designation"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      placeholder="e.g., Senior HR Manager"
                      defaultValue=""
                    />
                  </div>
                </div>
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
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Job'
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