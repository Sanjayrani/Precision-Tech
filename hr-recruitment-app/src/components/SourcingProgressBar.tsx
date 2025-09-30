'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Clock, Users } from 'lucide-react'

interface SourcingProgressBarProps {
  isVisible: boolean
  onComplete?: () => void
}

export default function SourcingProgressBar({ isVisible, onComplete }: SourcingProgressBarProps) {
  const [progress, setProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    if (!isVisible) {
      setProgress(0)
      setTimeRemaining(0)
      setIsCompleted(false)
      return
    }

    // Check if sourcing is already in progress from session storage
    const sourcingData = sessionStorage.getItem('sourcingProgress')
    let totalTime: number
    let startTime: number

    if (sourcingData) {
      // Resume existing progress
      const { totalTime: storedTotalTime, startTime: storedStartTime } = JSON.parse(sourcingData)
      totalTime = storedTotalTime
      startTime = storedStartTime
    } else {
      // Start new progress
      const minTime = 5 * 60 // 5 minutes
      const maxTime = 7 * 60 // 7 minutes
      totalTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime
      startTime = Date.now()
      
      // Store in session storage
      sessionStorage.setItem('sourcingProgress', JSON.stringify({
        totalTime,
        startTime
      }))
    }

    // Calculate elapsed time and remaining time
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    const remaining = Math.max(0, totalTime - elapsed)
    
    if (remaining <= 0) {
      // Already completed
      setIsCompleted(true)
      setProgress(100)
      setTimeRemaining(0)
      sessionStorage.removeItem('sourcingProgress')
      onComplete?.()
      return
    }

    setTimeRemaining(remaining)
    setProgress((elapsed / totalTime) * 100)

    const interval = setInterval(() => {
      const currentElapsed = Math.floor((Date.now() - startTime) / 1000)
      const currentRemaining = Math.max(0, totalTime - currentElapsed)
      const currentProgress = Math.min(100, (currentElapsed / totalTime) * 100)
      
      setProgress(currentProgress)
      setTimeRemaining(currentRemaining)
      
      if (currentRemaining <= 0) {
        setIsCompleted(true)
        setProgress(100)
        setTimeRemaining(0)
        sessionStorage.removeItem('sourcingProgress')
        onComplete?.()
        clearInterval(interval)
      }
    }, 2000) // Update every 2 seconds

    return () => clearInterval(interval)
  }, [isVisible, onComplete])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (!isVisible) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          {isCompleted ? (
            <CheckCircle className="h-6 w-6 text-green-500" />
          ) : (
            <div className="relative">
              <Users className="h-6 w-6 text-indigo-500 animate-pulse" />
              <Clock className="h-3 w-3 text-indigo-300 absolute -top-1 -right-1" />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {isCompleted ? 'Sourcing Complete!' : 'Sourcing Candidates...'}
            </h3>
            {!isCompleted && (
              <span className="text-sm text-gray-500">
                {formatTime(timeRemaining)} remaining
              </span>
            )}
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-1000 ${
                isCompleted 
                  ? 'bg-green-500' 
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          
          <p className="text-sm text-gray-600 mt-2">
            {isCompleted 
              ? 'Candidate sourcing has been completed. New candidates should appear in your list shortly.'
              : 'Our AI is actively searching LinkedIn and professional networks for qualified candidates. This process typically takes 5-7 minutes.'
            }
          </p>
        </div>
      </div>
    </div>
  )
}
