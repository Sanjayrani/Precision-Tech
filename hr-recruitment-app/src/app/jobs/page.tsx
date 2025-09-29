'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Layout from '@/components/Layout'
import JobDetailsDialog from '@/components/JobDetailsDialog'
import CreateJobDialog from '@/components/CreateJobDialog'
import { Search, Plus, MapPin, Calendar, Users, Target } from 'lucide-react'

interface Job {
  id: string
  title: string
  mode: string
  description: string
  location: string
  recruiterName: string
  recruiterEmail: string
  recruiterDesignation: string
  companyName: string
  companyDescription: string
  postedDate: string
  updatedDate: string
  jobStatus?: string
  isActive: boolean
  weights?: {
    technical_skills_weight?: number
    soft_skills_weight?: number
    open_to_work_weight?: number
    job_match_weight?: number
    location_match_weight?: number
    experience_weight?: number
    education_weight?: number
    custom_weights?: Array<{name: string, weight: number}>
  } | null
  _count: {
    candidates: number
  }
}

export default function JobsPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-gray-600">Loading jobs...</div>
          </div>
        </div>
      </Layout>
    }>
      <JobsPageContent />
    </Suspense>
  )
}

function JobsPageContent() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  // Total pages derived from filtered results; not tracked separately to avoid lints
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/job-jobstable`)
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter jobs based on search term and optional active-only query param
  const searchParams = useSearchParams()
  const activeOnly = searchParams.get('activeOnly') === '1'

  const filteredJobs = jobs.filter(job => {
    const searchLower = search.toLowerCase()
    const matchesSearch = !search || (
      job.title.toLowerCase().includes(searchLower) ||
      job.companyName.toLowerCase().includes(searchLower) ||
      job.location.toLowerCase().includes(searchLower) ||
      job.description.toLowerCase().includes(searchLower)
    )
    const matchesActive = !activeOnly || job.jobStatus === 'Active'
    return matchesSearch && matchesActive
  })

  // Paginate filtered jobs
  const jobsPerPage = 10
  const startIndex = (page - 1) * jobsPerPage
  const endIndex = startIndex + jobsPerPage
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex)
  const totalFilteredPages = Math.ceil(filteredJobs.length / jobsPerPage)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const handleJobClick = (job: Job) => {
    setSelectedJob(job)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedJob(null)
  }

  const handleOpenCreateDialog = () => {
    setIsCreateDialogOpen(true)
  }

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false)
  }

  const handleJobCreated = () => {
    // Refresh the jobs list after creating a new job
    fetchJobs()
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return 'N/A'
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-800'
      case 'Closed':
      case 'Inactive':
        return 'bg-red-100 text-red-800'
      case 'On Hold':
        return 'bg-yellow-100 text-yellow-800'
      case 'Draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-indigo-100 text-indigo-800'
    }
  }

  return (
    <Layout>
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
                <button
                  onClick={handleOpenCreateDialog}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Job
                </button>
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
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
                {paginatedJobs.map((job) => (
                  <li key={job.id}>
                    <button 
                      onClick={() => handleJobClick(job)}
                      className="block w-full text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-medium text-indigo-600 truncate">
                                  {job.title}
                                </h3>
                                <p className="text-xs font-bold text-black mt-1">Job ID: {job.id}</p>
                              </div>
                              <div className="ml-2 flex-shrink-0 flex items-center space-x-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getModeColor(job.mode)}`}>
                                  {job.mode}
                                </span>
                                {job.jobStatus && (
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.jobStatus)}`}>
                                    {job.jobStatus}
                                  </span>
                                )}
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
                            
                            {/* Weights Display */}
                            {job.weights && (
                              <div className="mt-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-100">
                                <div className="flex items-center mb-2">
                                  <Target className="h-4 w-4 text-indigo-600 mr-2" />
                                  <span className="text-sm font-medium text-indigo-900">Evaluation Weights</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {job.weights.technical_skills_weight && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-indigo-700 border border-indigo-200">
                                      Tech: {job.weights.technical_skills_weight}
                                    </span>
                                  )}
                                  {job.weights.experience_weight && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-indigo-700 border border-indigo-200">
                                      Exp: {job.weights.experience_weight}
                                    </span>
                                  )}
                                  {job.weights.soft_skills_weight && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-indigo-700 border border-indigo-200">
                                      Soft: {job.weights.soft_skills_weight}
                                    </span>
                                  )}
                                  {job.weights.education_weight && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-indigo-700 border border-indigo-200">
                                      Edu: {job.weights.education_weight}
                                    </span>
                                  )}
                                  {job.weights.job_match_weight && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-indigo-700 border border-indigo-200">
                                      Match: {job.weights.job_match_weight}
                                    </span>
                                  )}
                                  {job.weights.location_match_weight && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-indigo-700 border border-indigo-200">
                                      Loc: {job.weights.location_match_weight}
                                    </span>
                                  )}
                                  {job.weights.open_to_work_weight && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-indigo-700 border border-indigo-200">
                                      Open: {job.weights.open_to_work_weight}
                                    </span>
                                  )}
                                  {job.weights.custom_weights && job.weights.custom_weights.length > 0 && (
                                    <>
                                      {job.weights.custom_weights.slice(0, 2).map((customWeight, index) => (
                                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-indigo-700 border border-indigo-200">
                                          {customWeight.name}: {customWeight.weight}
                                        </span>
                                      ))}
                                      {job.weights.custom_weights.length > 2 && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-indigo-700 border border-indigo-200">
                                          +{job.weights.custom_weights.length - 2} more
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pagination */}
            {totalFilteredPages > 1 && (
              <div className="mt-6 flex justify-center">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalFilteredPages }, (_, i) => i + 1).map((pageNum) => (
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
                    onClick={() => setPage(Math.min(totalFilteredPages, page + 1))}
                    disabled={page === totalFilteredPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}

            {paginatedJobs.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  {search ? 'No jobs found matching your search.' : 'No jobs posted yet.'}
                </div>
                <button
                  onClick={handleOpenCreateDialog}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Job
                </button>
              </div>
            )}
          </>
        )}
      </div>
      </div>

      {/* Job Details Dialog */}
      <JobDetailsDialog
        job={selectedJob}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
      />

      {/* Create Job Dialog */}
      <CreateJobDialog
        isOpen={isCreateDialogOpen}
        onClose={handleCloseCreateDialog}
        onJobCreated={handleJobCreated}
      />
    </Layout>
  )
}
