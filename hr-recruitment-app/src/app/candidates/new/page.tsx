'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Layout from '@/components/Layout'

interface Job {
  id: string
  title: string
  companyName: string
}

export default function NewCandidatePage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [formData, setFormData] = useState({
    candidateName: '',
    email: '',
    phoneNumber: '',
    linkedinUrl: '',
    skills: '',
    experience: '',
    projects: '',
    education: '',
    certificates: '',
    endorsements: '',
    currentJobTitle: '',
    currentEmployer: '',
    openToWork: true,
    candidateLocation: '',
    jobId: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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

    try {
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/candidates')
      } else {
        setError(data.error || 'Failed to create candidate')
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
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    })
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Candidate</h1>
          <p className="text-gray-600">Add a new candidate to the recruitment pipeline</p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="candidateName" className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="candidateName"
                  id="candidateName"
                  required
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  placeholder="e.g., John Doe"
                  value={formData.candidateName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  id="phoneNumber"
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  name="linkedinUrl"
                  id="linkedinUrl"
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  placeholder="https://linkedin.com/in/johndoe"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="candidateLocation" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  name="candidateLocation"
                  id="candidateLocation"
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  placeholder="e.g., San Francisco, CA"
                  value={formData.candidateLocation}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="jobId" className="block text-sm font-medium text-gray-700">
                  Job Position *
                </label>
                <select
                  name="jobId"
                  id="jobId"
                  required
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  value={formData.jobId}
                  onChange={handleChange}
                >
                  <option value="">Select a job position</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} at {job.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                  Skills *
                </label>
                <textarea
                  name="skills"
                  id="skills"
                  rows={3}
                  required
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  placeholder="e.g., JavaScript, React, Node.js, Python, AWS..."
                  value={formData.skills}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="currentJobTitle" className="block text-sm font-medium text-gray-700">
                  Current Job Title
                </label>
                <input
                  type="text"
                  name="currentJobTitle"
                  id="currentJobTitle"
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  placeholder="e.g., Senior Software Engineer"
                  value={formData.currentJobTitle}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="currentEmployer" className="block text-sm font-medium text-gray-700">
                  Current Employer
                </label>
                <input
                  type="text"
                  name="currentEmployer"
                  id="currentEmployer"
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  placeholder="e.g., Tech Corp Inc."
                  value={formData.currentEmployer}
                  onChange={handleChange}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                  Experience
                </label>
                <textarea
                  name="experience"
                  id="experience"
                  rows={4}
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  placeholder="Describe work experience, years of experience, key achievements..."
                  value={formData.experience}
                  onChange={handleChange}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="education" className="block text-sm font-medium text-gray-700">
                  Education
                </label>
                <textarea
                  name="education"
                  id="education"
                  rows={3}
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  placeholder="Educational background, degrees, institutions..."
                  value={formData.education}
                  onChange={handleChange}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="projects" className="block text-sm font-medium text-gray-700">
                  Projects
                </label>
                <textarea
                  name="projects"
                  id="projects"
                  rows={3}
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  placeholder="Notable projects, GitHub links, portfolio..."
                  value={formData.projects}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="certificates" className="block text-sm font-medium text-gray-700">
                  Certificates
                </label>
                <textarea
                  name="certificates"
                  id="certificates"
                  rows={2}
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  placeholder="Professional certifications..."
                  value={formData.certificates}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="endorsements" className="block text-sm font-medium text-gray-700">
                  Endorsements
                </label>
                <textarea
                  name="endorsements"
                  id="endorsements"
                  rows={2}
                  className="mt-1 block w-full px-4 py-3 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                  placeholder="LinkedIn endorsements, recommendations..."
                  value={formData.endorsements}
                  onChange={handleChange}
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center">
                  <input
                    id="openToWork"
                    name="openToWork"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={formData.openToWork}
                    onChange={handleChange}
                  />
                  <label htmlFor="openToWork" className="ml-2 block text-sm text-gray-900">
                    Open to work
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                href="/candidates"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Candidate'}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </Layout>
  )
}
