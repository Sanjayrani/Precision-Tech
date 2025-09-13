'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, MapPin, Calendar, Users } from 'lucide-react'

interface Job {
  id: string
  title: string
  mode: string
  description: string
  location: string
  recruiterName: string
  recruiterDesignation: string
  companyName: string
  companyDescription: string | null
  postedDate: string
  updatedDate: string
  isActive: boolean
  _count: {
    candidates: number
  }
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchJobs()
  }, [page, search])

  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
      })

      const response = await fetch(`/api/jobs?${params}`)
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchJobs()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'remote':
        return 'bg-green-100 text-green-800'
      case 'hybrid':
        return 'bg-yellow-100 text-yellow-800'
      case 'onsite':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
              <p className="text-gray-600">Manage all your job postings and requirements</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </Link>
              <Link
                href="/jobs/new"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Job
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search jobs by title, company, or location..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
            >
              Search
            </button>
          </form>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg">Loading jobs...</div>
          </div>
        ) : (
          <>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {jobs.map((job) => (
                  <li key={job.id}>
                    <Link href={`/jobs/${job.id}`} className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-medium text-indigo-600 truncate">
                                {job.title}
                              </h3>
                              <div className="ml-2 flex-shrink-0 flex">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getModeColor(job.mode)}`}>
                                  {job.mode}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500">
                                  <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                  {job.companyName}
                                </p>
                                <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                  <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                  {job.location}
                                </p>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                <p>
                                  Posted on {formatDate(job.postedDate)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {job.description.substring(0, 150)}...
                              </p>
                              <div className="ml-4 flex-shrink-0">
                                <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                  {job._count.candidates} candidates
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
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
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}

            {jobs.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  {search ? 'No jobs found matching your search.' : 'No jobs posted yet.'}
                </div>
                <Link
                  href="/jobs/new"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post Your First Job
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
