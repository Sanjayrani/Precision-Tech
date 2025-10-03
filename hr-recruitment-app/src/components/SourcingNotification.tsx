'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Clock, Users, X, ChevronDown, ChevronUp } from 'lucide-react'

interface SourcingJob {
  id: string
  jobTitle: string
  startTime: number
  totalTime: number
  isCompleted: boolean
}

interface SourcingNotificationProps {
  isVisible: boolean
  onComplete?: () => void
  onDismiss?: () => void
}

export default function SourcingNotification({ isVisible, onComplete, onDismiss }: SourcingNotificationProps) {
  const [sourcingJobs, setSourcingJobs] = useState<SourcingJob[]>([])
  const [isCollapsed, setIsCollapsed] = useState(true)

  useEffect(() => {
    if (!isVisible) {
      setSourcingJobs([])
      return
    }

    // Check for existing sourcing jobs in session storage
    const existingJobs = sessionStorage.getItem('sourcingJobs')
    if (existingJobs) {
      const jobs = JSON.parse(existingJobs)
      setSourcingJobs(jobs)
    }
  }, [isVisible])

  useEffect(() => {
    if (sourcingJobs.length === 0) return

    const interval = setInterval(() => {
      setSourcingJobs(prevJobs => {
        const updatedJobs = prevJobs.map(job => {
          if (job.isCompleted) return job

          const elapsed = Math.floor((Date.now() - job.startTime) / 1000)
          const remaining = Math.max(0, job.totalTime - elapsed)
          
          if (remaining <= 0) {
            return { ...job, isCompleted: true }
          }
          
          return job
        })

        // Update session storage
        sessionStorage.setItem('sourcingJobs', JSON.stringify(updatedJobs))

        // Check if all jobs are completed
        const allCompleted = updatedJobs.every(job => job.isCompleted)
        if (allCompleted) {
          setTimeout(() => {
            sessionStorage.removeItem('sourcingJobs')
            onComplete?.()
          }, 2000) // Show completion for 2 seconds
        }

        return updatedJobs
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [sourcingJobs.length, onComplete])


  const getJobProgress = (job: SourcingJob) => {
    if (job.isCompleted) return 100
    const elapsed = Math.floor((Date.now() - job.startTime) / 1000)
    const progress = Math.min(100, (elapsed / job.totalTime) * 100)
    return progress
  }

  const getJobTimeRemaining = (job: SourcingJob) => {
    if (job.isCompleted) return 0
    const elapsed = Math.floor((Date.now() - job.startTime) / 1000)
    return Math.max(0, job.totalTime - elapsed)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }


  // Filter to only show in-progress jobs
  const activeJobs = sourcingJobs.filter(job => !job.isCompleted)
  const allCompleted = activeJobs.length === 0

  if (!isVisible || activeJobs.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-0 overflow-hidden backdrop-blur-sm">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  {allCompleted ? (
                    <CheckCircle className="w-4 h-4 text-white" />
                  ) : (
                    <Users className="w-4 h-4 text-white" />
                  )}
                </div>
                {!allCompleted && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold">
                  {allCompleted ? 'Sourcing Complete!' : 'AI Sourcing Active'}
                </h4>
                <p className="text-xs text-white/80">
                  {allCompleted 
                    ? 'All jobs completed' 
                    : `${activeJobs.length} job${activeJobs.length > 1 ? 's' : ''} in progress`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                title={isCollapsed ? 'Show details' : 'Hide details'}
              >
                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
              <button
                onClick={onDismiss}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                title="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Content */}
        {!isCollapsed && (
          <div className="p-4 space-y-4">
            {allCompleted && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-green-800">Sourcing Complete!</h5>
                    <p className="text-xs text-green-600">Candidates found and added to your list</p>
                  </div>
                </div>
              </div>
            )}

            {/* Individual Jobs with Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-semibold text-gray-800">Active Jobs</h5>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {activeJobs.length} in progress
                </span>
              </div>
              
              <div className="space-y-3">
                {activeJobs.map((job) => (
                  <div key={job.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          job.isCompleted 
                            ? 'bg-green-500' 
                            : 'bg-indigo-500'
                        }`} />
                        <span className="text-sm font-medium text-gray-800">{job.jobTitle}</span>
                      </div>
                      <div className="text-sm font-semibold text-gray-600">
                        {job.isCompleted ? (
                          <span className="text-green-600">Complete</span>
                        ) : (
                          <span>{Math.round(getJobProgress(job))}%</span>
                        )}
                      </div>
                    </div>
                    
                    {!job.isCompleted && (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-medium text-gray-700">{formatTime(getJobTimeRemaining(job))} remaining</span>
                          </div>
                          <span className="text-sm font-semibold text-indigo-600">{Math.round(getJobProgress(job))}%</span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${Math.min(getJobProgress(job), 100)}%` }}
                          />
                        </div>
                        
                        <p className="text-xs text-gray-500 leading-relaxed mt-2">
                          Our AI is searching LinkedIn and professional networks for qualified candidates for {job.jobTitle}. 
                          This typically takes 5-7 minutes.
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
