'use client'

import { X, MapPin, Calendar, Users, Mail, Briefcase, Building, Clock } from 'lucide-react'

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
  isActive: boolean
  _count: {
    candidates: number
  }
}

interface JobDetailsDialogProps {
  job: Job | null
  isOpen: boolean
  onClose: () => void
}

export default function JobDetailsDialog({ job, isOpen, onClose }: JobDetailsDialogProps) {
  if (!isOpen || !job) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'remote':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'hybrid':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'onsite':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'remote':
        return '🏠'
      case 'hybrid':
        return '🔄'
      case 'onsite':
        return '🏢'
      default:
        return '📍'
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
                <div className="flex items-center space-x-4 mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getModeColor(job.mode)}`}>
                    <span className="mr-1">{getModeIcon(job.mode)}</span>
                    {job.mode.charAt(0).toUpperCase() + job.mode.slice(1)}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                    <Users className="h-4 w-4 mr-1" />
                    {job._count.candidates} candidates
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Company & Location Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center mb-2">
                  <Building className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-blue-900">Company</h3>
                </div>
                <p className="text-lg font-medium text-gray-900">{job.companyName}</p>
                {job.companyDescription && (
                  <p className="text-sm text-gray-600 mt-1">{job.companyDescription}</p>
                )}
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-center mb-2">
                  <MapPin className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="font-semibold text-green-900">Location</h3>
                </div>
                <p className="text-lg font-medium text-gray-900">{job.location}</p>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-gray-600" />
                Job Description
              </h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </div>
            </div>

            {/* Recruiter Information */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
              <h3 className="font-semibold text-purple-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Recruiter Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-gray-900">{job.recruiterName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Designation</p>
                  <p className="text-gray-900">{job.recruiterDesignation}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <a 
                    href={`mailto:${job.recruiterEmail}`}
                    className="text-indigo-600 hover:text-indigo-700 flex items-center"
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    {job.recruiterEmail}
                  </a>
                </div>
              </div>
            </div>

            {/* Job Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
                <div className="flex items-center mb-2">
                  <Calendar className="h-5 w-5 text-orange-600 mr-2" />
                  <h3 className="font-semibold text-orange-900">Posted On</h3>
                </div>
                <p className="text-gray-900">{formatDate(job.postedDate)}</p>
              </div>
              
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-100">
                <div className="flex items-center mb-2">
                  <Clock className="h-5 w-5 text-teal-600 mr-2" />
                  <h3 className="font-semibold text-teal-900">Last Updated</h3>
                </div>
                <p className="text-gray-900">{formatDate(job.updatedDate)}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${job.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {job.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
              >
                Apply Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
