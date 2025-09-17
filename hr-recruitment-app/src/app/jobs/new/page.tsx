'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Layout from '@/components/Layout'

export default function NewJobPage() {
  const [formData, setFormData] = useState({
    title: '',
    mode: 'remote',
    description: '',
    location: '',
    recruiterName: '',
    recruiterDetails: '',
    recruiterDesignation: '',
    companyName: '',
    companyDescription: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/jobs')
      } else {
        setError(data.error || 'Failed to create job')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Post New Job</h1>
          <p className="text-gray-600">Create a new job posting to attract candidates</p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Job Title *
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  placeholder="e.g., Senior Software Engineer"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="mode" className="block text-sm font-medium text-gray-700">
                  Work Mode *
                </label>
                <select
                  name="mode"
                  id="mode"
                  required
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  value={formData.mode}
                  onChange={handleChange}
                >
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  id="location"
                  required
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  placeholder="e.g., San Francisco, CA"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Job Description *
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={6}
                  required
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  placeholder="Describe the role, responsibilities, requirements, and qualifications..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  id="companyName"
                  required
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  placeholder="e.g., Precision Tech Corp"
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="recruiterName" className="block text-sm font-medium text-gray-700">
                  Recruiter Name *
                </label>
                <input
                  type="text"
                  name="recruiterName"
                  id="recruiterName"
                  required
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  placeholder="e.g., John Doe"
                  value={formData.recruiterName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="recruiterDesignation" className="block text-sm font-medium text-gray-700">
                  Recruiter Designation *
                </label>
                <input
                  type="text"
                  name="recruiterDesignation"
                  id="recruiterDesignation"
                  required
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  placeholder="e.g., Senior HR Manager"
                  value={formData.recruiterDesignation}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="recruiterDetails" className="block text-sm font-medium text-gray-700">
                  Recruiter Details
                </label>
                <input
                  type="text"
                  name="recruiterDetails"
                  id="recruiterDetails"
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  placeholder="Contact information, LinkedIn profile, etc."
                  value={formData.recruiterDetails}
                  onChange={handleChange}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="companyDescription" className="block text-sm font-medium text-gray-700">
                  Company Description
                </label>
                <textarea
                  name="companyDescription"
                  id="companyDescription"
                  rows={3}
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  placeholder="Brief description about the company..."
                  value={formData.companyDescription}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                href="/jobs"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Job'}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </Layout>
  )
}
