'use client'

import { X, Mail, Phone, MapPin, Calendar, Star, ExternalLink, User, Briefcase, Award, BookOpen, MessageSquare, CheckCircle, Clock, Users } from 'lucide-react'

interface Candidate {
  id: string
  candidateName: string
  email: string
  phoneNumber: string
  linkedinUrl: string
  skills: string
  experience: string
  certifications: string
  projects: string
  miscellaneousInformation: string
  candidateScore: number
  scoreDescription: string
  jobsMapped: string
  currentJobTitle: string
  currentEmployer: string
  openToWork: boolean
  education: string
  endorsements: string
  recommendationsReceived: number
  linkedinInmailMessageStatus: string
  emailStatus: string
  linkedinMessages: number
  emailMessages: number
  overallMessages: number
  followUpCount: number
  candidateLocation: string
  lastContactedDate: string
  providerId: string
  linkedinMessageRead: boolean
  jobId: string
  replyStatus: string
  emailMessageRead: boolean
  linkedinMessage: string
  meetingLink: string
  meetingDate: string
  eventId: string
  emailProviderId: string
  subject: string
  status: string
  interviewDate: string | null
  createdAt: string
  job: {
    id: string
    title: string
    companyName: string
  }
}

interface CandidateDetailsDialogProps {
  candidate: Candidate | null
  isOpen: boolean
  onClose: () => void
}

export default function CandidateDetailsDialog({ candidate, isOpen, onClose }: CandidateDetailsDialogProps) {
  if (!isOpen || !candidate) return null

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200'
    
    switch (status) {
      case 'Selected':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Interview Scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Sourced':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getCommunicationStatus = (status: string) => {
    switch (status) {
      case 'replied':
        return { color: 'text-green-600', icon: CheckCircle, text: 'Replied' }
      case 'sent':
        return { color: 'text-blue-600', icon: MessageSquare, text: 'Sent' }
      case 'read':
        return { color: 'text-purple-600', icon: CheckCircle, text: 'Read' }
      default:
        return { color: 'text-gray-600', icon: Clock, text: 'Pending' }
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
        <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{candidate.candidateName}</h2>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(candidate.status)}`}>
                      {candidate.status ? candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1) : 'Unknown'}
                    </span>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(candidate.candidateScore)}`}>
                      <Star className="h-4 w-4 mr-1" />
                      {candidate.candidateScore}/10
                    </div>
                    {candidate.openToWork && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Open to Work
                      </span>
                    )}
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
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <a 
                      href={`mailto:${candidate.email}`}
                      className="text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      {candidate.email}
                    </a>
                  </div>
                  {candidate.phoneNumber && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <a 
                        href={`tel:${candidate.phoneNumber}`}
                        className="text-blue-600 hover:text-blue-700 flex items-center"
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        {candidate.phoneNumber}
                      </a>
                    </div>
                  )}
                  {candidate.candidateLocation && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Location</p>
                      <p className="text-gray-900 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {candidate.candidateLocation}
                      </p>
                    </div>
                  )}
                  {candidate.linkedinUrl && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">LinkedIn</p>
                      <a 
                        href={candidate.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 flex items-center"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Profile
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                <h3 className="font-semibold text-green-900 mb-4 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2" />
                  Current Position
                </h3>
                <div className="space-y-3">
                  {candidate.currentJobTitle && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Job Title</p>
                      <p className="text-gray-900">{candidate.currentJobTitle}</p>
                    </div>
                  )}
                  {candidate.currentEmployer && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Company</p>
                      <p className="text-gray-900">{candidate.currentEmployer}</p>
                    </div>
                  )}
                  {candidate.jobsMapped && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Mapped Jobs</p>
                      <p className="text-gray-900">{candidate.jobsMapped}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Skills and Experience */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-gray-600" />
                  Skills & Experience
                </h3>
                <div className="space-y-4">
                  {candidate.skills && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Skills</p>
                      <p className="text-gray-700 leading-relaxed">{String(candidate.skills || '')}</p>
                    </div>
                  )}
                  {candidate.experience && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Experience</p>
                      <p className="text-gray-700 leading-relaxed">{candidate.experience}</p>
                    </div>
                  )}
                  {candidate.education && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Education</p>
                      <p className="text-gray-700 leading-relaxed">{candidate.education}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-gray-600" />
                  Additional Information
                </h3>
                <div className="space-y-4">
                  {candidate.certifications && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Certifications</p>
                      <p className="text-gray-700 leading-relaxed">{candidate.certifications}</p>
                    </div>
                  )}
                  {candidate.projects && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Projects</p>
                      <p className="text-gray-700 leading-relaxed">{candidate.projects}</p>
                    </div>
                  )}
                  {candidate.endorsements && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Endorsements</p>
                      <p className="text-gray-700 leading-relaxed">{candidate.endorsements}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Communication History */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
              <h3 className="font-semibold text-purple-900 mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Communication History
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">LinkedIn Messages</p>
                  <p className="text-2xl font-bold text-gray-900">{candidate.linkedinMessages}</p>
                  <div className="flex items-center mt-1">
                    {(() => {
                      const status = getCommunicationStatus(candidate.linkedinInmailMessageStatus)
                      const IconComponent = status.icon
                      return (
                        <>
                          <IconComponent className={`h-4 w-4 mr-1 ${status.color}`} />
                          <span className={`text-sm ${status.color}`}>{status.text}</span>
                        </>
                      )
                    })()}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email Messages</p>
                  <p className="text-2xl font-bold text-gray-900">{candidate.emailMessages}</p>
                  <div className="flex items-center mt-1">
                    {(() => {
                      const status = getCommunicationStatus(candidate.emailStatus)
                      const IconComponent = status.icon
                      return (
                        <>
                          <IconComponent className={`h-4 w-4 mr-1 ${status.color}`} />
                          <span className={`text-sm ${status.color}`}>{status.text}</span>
                        </>
                      )
                    })()}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Follow-ups</p>
                  <p className="text-2xl font-bold text-gray-900">{candidate.followUpCount}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Last: {formatDate(candidate.lastContactedDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Score Details */}
            {candidate.scoreDescription && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-100">
                <h3 className="font-semibold text-yellow-900 mb-4 flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Candidate Score Details
                </h3>
                <p className="text-gray-700 leading-relaxed">{candidate.scoreDescription}</p>
              </div>
            )}

            {/* Miscellaneous Information */}
            {candidate.miscellaneousInformation && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Additional Notes</h3>
                <p className="text-gray-700 leading-relaxed">{candidate.miscellaneousInformation}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
                <div className="flex items-center mb-2">
                  <Calendar className="h-5 w-5 text-orange-600 mr-2" />
                  <h3 className="font-semibold text-orange-900">Added to System</h3>
                </div>
                <p className="text-gray-900">{formatDate(candidate.createdAt)}</p>
              </div>
              
              {candidate.interviewDate && (
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-100">
                  <div className="flex items-center mb-2">
                    <Users className="h-5 w-5 text-teal-600 mr-2" />
                    <h3 className="font-semibold text-teal-900">Interview Scheduled</h3>
                  </div>
                  <p className="text-gray-900">{formatDate(candidate.interviewDate)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Candidate ID: {candidate.id}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                >
                  Contact Candidate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
