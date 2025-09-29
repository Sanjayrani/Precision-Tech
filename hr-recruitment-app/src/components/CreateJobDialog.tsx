'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Briefcase, Building, User, Target, BarChart3, Plus, Trash2 } from 'lucide-react'

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
  const [totalWeight, setTotalWeight] = useState(100)
  const [customWeights, setCustomWeights] = useState<Array<{id: string, name: string, weight: number}>>([])
  const [newCustomWeight, setNewCustomWeight] = useState({name: '', weight: 0})
  const [activeStandardWeights, setActiveStandardWeights] = useState<Set<string>>(new Set([
    'technical_skills_weight',
    'soft_skills_weight',
    'open_to_work_weight',
    'job_match_weight',
    'location_match_weight',
    'experience_weight',
    'education_weight'
  ]))
  const [autoAdjustEnabled, setAutoAdjustEnabled] = useState(true)
  const [weightNotification, setWeightNotification] = useState<{type: 'info' | 'warning' | 'success', message: string} | null>(null)

  // Clear form when dialog opens
  useEffect(() => {
    if (isOpen && formRef.current) {
      formRef.current.reset()
      setError('')
      setSuccess('')
      setTotalWeight(100)
      setCustomWeights([])
      setNewCustomWeight({name: '', weight: 0})
      setActiveStandardWeights(new Set([
        'technical_skills_weight',
        'soft_skills_weight',
        'open_to_work_weight',
        'job_match_weight',
        'location_match_weight',
        'experience_weight',
        'education_weight'
      ]))
      setWeightNotification(null)
    }
  }, [isOpen])

  // Function to calculate total weight
  const calculateTotalWeight = () => {
    if (!formRef.current) return
    
    const standardTotal = Array.from(activeStandardWeights).reduce((sum, inputName) => {
      const input = formRef.current?.querySelector(`[name="${inputName}"]`) as HTMLInputElement
      return sum + (parseInt(input?.value) || 0)
    }, 0)
    
    const customTotal = customWeights.reduce((sum, customWeight) => sum + customWeight.weight, 0)
    
    const newTotal = standardTotal + customTotal
    setTotalWeight(newTotal)
    
    // Auto-adjust if enabled and total exceeds 100%
    if (autoAdjustEnabled && newTotal > 100) {
      autoAdjustWeights(newTotal)
    } else if (newTotal > 100) {
      setWeightNotification({
        type: 'warning',
        message: `Total weight is ${newTotal}%. Please reduce weights to reach 100%.`
      })
    } else if (newTotal < 100) {
      setWeightNotification({
        type: 'info',
        message: `${100 - newTotal}% remaining to reach 100%.`
      })
    } else {
      setWeightNotification({
        type: 'success',
        message: 'Perfect! All weights add up to 100%.'
      })
    }
  }

  // Auto-adjust weights when total exceeds 100%
  const autoAdjustWeights = (currentTotal: number) => {
    const excess = currentTotal - 100
    const totalWeights = Array.from(activeStandardWeights).length + customWeights.length
    
    if (totalWeights === 0) return
    
    const reductionPerWeight = Math.ceil(excess / totalWeights)
    
    // Adjust standard weights
    Array.from(activeStandardWeights).forEach(weightName => {
      const input = formRef.current?.querySelector(`[name="${weightName}"]`) as HTMLInputElement
      if (input) {
        const currentValue = parseInt(input.value) || 0
        const newValue = Math.max(0, currentValue - reductionPerWeight)
        input.value = newValue.toString()
      }
    })
    
    // Adjust custom weights
    setCustomWeights(customWeights.map(weight => ({
      ...weight,
      weight: Math.max(0, weight.weight - reductionPerWeight)
    })))
    
    setWeightNotification({
      type: 'info',
      message: `Auto-adjusted weights to reach 100%. Each weight was reduced by ${reductionPerWeight}%.`
    })
    
    // Recalculate after adjustment
    setTimeout(calculateTotalWeight, 100)
  }

  // Balance weights proportionally to reach exactly 100%
  const balanceWeights = () => {
    const standardTotal = Array.from(activeStandardWeights).reduce((sum, inputName) => {
      const input = formRef.current?.querySelector(`[name="${inputName}"]`) as HTMLInputElement
      return sum + (parseInt(input?.value) || 0)
    }, 0)
    
    const customTotal = customWeights.reduce((sum, customWeight) => sum + customWeight.weight, 0)
    const currentTotal = standardTotal + customTotal
    
    if (currentTotal === 0) return
    
    const scaleFactor = 100 / currentTotal
    
    // Scale standard weights proportionally
    Array.from(activeStandardWeights).forEach(weightName => {
      const input = formRef.current?.querySelector(`[name="${weightName}"]`) as HTMLInputElement
      if (input) {
        const currentValue = parseInt(input.value) || 0
        const newValue = Math.round(currentValue * scaleFactor)
        input.value = newValue.toString()
      }
    })
    
    // Scale custom weights proportionally
    setCustomWeights(customWeights.map(weight => ({
      ...weight,
      weight: Math.round(weight.weight * scaleFactor)
    })))
    
    setWeightNotification({
      type: 'success',
      message: 'Weights balanced proportionally to reach exactly 100%.'
    })
    
    // Recalculate after balancing
    setTimeout(calculateTotalWeight, 100)
  }

  // Get smart suggestions for weight distribution
  const getWeightSuggestions = () => {
    const activeCount = Array.from(activeStandardWeights).length + customWeights.length
    if (activeCount === 0) return null
    
    const suggestedWeight = Math.floor(100 / activeCount)
    const remainder = 100 % activeCount
    
    return {
      baseWeight: suggestedWeight,
      remainder: remainder,
      suggestion: `For equal distribution, consider ${suggestedWeight}% per weight${remainder > 0 ? ` (with ${remainder}% extra to distribute)` : ''}.`
    }
  }

  // Add event listeners for weight inputs
  useEffect(() => {
    if (isOpen && formRef.current) {
      const weightInputs = formRef.current.querySelectorAll('input[name$="_weight"]')
      weightInputs.forEach(input => {
        input.addEventListener('input', calculateTotalWeight)
        input.addEventListener('change', calculateTotalWeight)
      })
      
      return () => {
        weightInputs.forEach(input => {
          input.removeEventListener('input', calculateTotalWeight)
          input.removeEventListener('change', calculateTotalWeight)
        })
      }
    }
  }, [isOpen])

  // Custom weight functions
  const addCustomWeight = () => {
    if (newCustomWeight.name.trim() && newCustomWeight.weight > 0) {
      const newWeight = {
        id: Date.now().toString(),
        name: newCustomWeight.name.trim(),
        weight: newCustomWeight.weight
      }
      setCustomWeights([...customWeights, newWeight])
      setNewCustomWeight({name: '', weight: 0})
      
      // Check if this addition would exceed 100%
      const currentTotal = totalWeight
      if (currentTotal + newCustomWeight.weight > 100) {
        setWeightNotification({
          type: 'warning',
          message: `Adding this weight would exceed 100%. Consider reducing other weights or using the balance feature.`
        })
      }
      
      // Recalculate total after a short delay to ensure state is updated
      setTimeout(calculateTotalWeight, 100)
    }
  }

  const removeCustomWeight = (id: string) => {
    setCustomWeights(customWeights.filter(weight => weight.id !== id))
    // Recalculate total after a short delay to ensure state is updated
    setTimeout(calculateTotalWeight, 100)
  }

  const updateCustomWeight = (id: string, field: 'name' | 'weight', value: string | number) => {
    setCustomWeights(customWeights.map(weight => 
      weight.id === id ? { ...weight, [field]: value } : weight
    ))
    // Recalculate total after a short delay to ensure state is updated
    setTimeout(calculateTotalWeight, 100)
  }

  const removeStandardWeight = (weightName: string) => {
    const newActiveWeights = new Set(activeStandardWeights)
    newActiveWeights.delete(weightName)
    setActiveStandardWeights(newActiveWeights)
    // Recalculate total after a short delay to ensure state is updated
    setTimeout(calculateTotalWeight, 100)
  }

  const addStandardWeight = (weightName: string) => {
    const newActiveWeights = new Set(activeStandardWeights)
    newActiveWeights.add(weightName)
    setActiveStandardWeights(newActiveWeights)
    // Recalculate total after a short delay to ensure state is updated
    setTimeout(calculateTotalWeight, 100)
  }

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

    // Validate weights sum to 100
    if (totalWeight !== 100) {
      if (autoAdjustEnabled) {
        // Auto-adjust if enabled
        balanceWeights()
        setError('Weights have been automatically balanced to 100%. Please review and submit again.')
      } else {
        setError(`Weights must sum to exactly 100%. Current total: ${totalWeight}%. Use the "Balance to 100%" button to fix automatically.`)
      }
      setLoading(false)
      return
    }

    try {
      // Get form data using FormData
      const formData = new FormData(formRef.current)
      // Build weights object dynamically based on active weights
      const weights: Record<string, number> = {}
      
      // Add active standard weights
      if (activeStandardWeights.has('technical_skills_weight')) {
        weights.technical_skills_weight = parseInt(formData.get('technical_skills_weight') as string) || 35
      }
      if (activeStandardWeights.has('soft_skills_weight')) {
        weights.soft_skills_weight = parseInt(formData.get('soft_skills_weight') as string) || 15
      }
      if (activeStandardWeights.has('open_to_work_weight')) {
        weights.open_to_work_weight = parseInt(formData.get('open_to_work_weight') as string) || 5
      }
      if (activeStandardWeights.has('job_match_weight')) {
        weights.job_match_weight = parseInt(formData.get('job_match_weight') as string) || 15
      }
      if (activeStandardWeights.has('location_match_weight')) {
        weights.location_match_weight = parseInt(formData.get('location_match_weight') as string) || 5
      }
      if (activeStandardWeights.has('experience_weight')) {
        weights.experience_weight = parseInt(formData.get('experience_weight') as string) || 15
      }
      if (activeStandardWeights.has('education_weight')) {
        weights.education_weight = parseInt(formData.get('education_weight') as string) || 10
      }

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
        // Active standard weights
        ...weights,
        // Custom weights
        custom_weights: customWeights,
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

              {/* Weights Section */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                <h3 className="font-semibold text-orange-900 mb-4 flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Candidate Evaluation Weights
                </h3>
                <p className="text-sm text-orange-700 mb-6">
                  Set the importance weights for different evaluation criteria. Total must equal 100%.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Technical Skills */}
                  {activeStandardWeights.has('technical_skills_weight') && (
                    <div className="bg-white rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-between mb-3">
                        <label htmlFor="technical_skills_weight" className="text-sm font-medium text-gray-700">
                          Technical Skills
                        </label>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">High Impact</span>
                          <button
                            type="button"
                            onClick={() => removeStandardWeight('technical_skills_weight')}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove this weight"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          id="technical_skills_weight"
                          name="technical_skills_weight"
                          min="0"
                          max="100"
                          defaultValue="35"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-center"
                        />
                        
                      </div>
                    </div>
                  )}

                  {/* Soft Skills */}
                  {activeStandardWeights.has('soft_skills_weight') && (
                    <div className="bg-white rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-between mb-3">
                        <label htmlFor="soft_skills_weight" className="text-sm font-medium text-gray-700">
                          Soft Skills
                        </label>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Team Fit</span>
                          <button
                            type="button"
                            onClick={() => removeStandardWeight('soft_skills_weight')}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove this weight"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          id="soft_skills_weight"
                          name="soft_skills_weight"
                          min="0"
                          max="100"
                          defaultValue="15"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-center"
                        />
                        
                      </div>
                    </div>
                  )}

                  {/* Open to Work */}
                  {activeStandardWeights.has('open_to_work_weight') && (
                    <div className="bg-white rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-between mb-3">
                        <label htmlFor="open_to_work_weight" className="text-sm font-medium text-gray-700">
                          Open to Work
                        </label>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Availability</span>
                          <button
                            type="button"
                            onClick={() => removeStandardWeight('open_to_work_weight')}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove this weight"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          id="open_to_work_weight"
                          name="open_to_work_weight"
                          min="0"
                          max="100"
                          defaultValue="5"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-center"
                        />
                        
                      </div>
                    </div>
                  )}

                  {/* Job Match */}
                  {activeStandardWeights.has('job_match_weight') && (
                    <div className="bg-white rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-between mb-3">
                        <label htmlFor="job_match_weight" className="text-sm font-medium text-gray-700">
                          Job Match
                        </label>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Role Alignment</span>
                          <button
                            type="button"
                            onClick={() => removeStandardWeight('job_match_weight')}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove this weight"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          id="job_match_weight"
                          name="job_match_weight"
                          min="0"
                          max="100"
                          defaultValue="15"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-center"
                        />
                        
                      </div>
                    </div>
                  )}

                  {/* Location Match */}
                  {activeStandardWeights.has('location_match_weight') && (
                    <div className="bg-white rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-between mb-3">
                        <label htmlFor="location_match_weight" className="text-sm font-medium text-gray-700">
                          Location Match
                        </label>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Geographic</span>
                          <button
                            type="button"
                            onClick={() => removeStandardWeight('location_match_weight')}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove this weight"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          id="location_match_weight"
                          name="location_match_weight"
                          min="0"
                          max="100"
                          defaultValue="5"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-center"
                        />
                        
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {activeStandardWeights.has('experience_weight') && (
                    <div className="bg-white rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-between mb-3">
                        <label htmlFor="experience_weight" className="text-sm font-medium text-gray-700">
                          Experience
                        </label>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Years & Quality</span>
                          <button
                            type="button"
                            onClick={() => removeStandardWeight('experience_weight')}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove this weight"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          id="experience_weight"
                          name="experience_weight"
                          min="0"
                          max="100"
                          defaultValue="15"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-center"
                        />
                        
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {activeStandardWeights.has('education_weight') && (
                    <div className="bg-white rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-between mb-3">
                        <label htmlFor="education_weight" className="text-sm font-medium text-gray-700">
                          Education
                        </label>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Academic Background</span>
                          <button
                            type="button"
                            onClick={() => removeStandardWeight('education_weight')}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove this weight"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          id="education_weight"
                          name="education_weight"
                          min="0"
                          max="100"
                          defaultValue="10"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 text-center"
                        />
                        
                      </div>
                    </div>
                  )}
                </div>

                {/* Total Weight Display */}
                <div className="mt-6 bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BarChart3 className="h-5 w-5 text-orange-600 mr-2" />
                      <span className="font-medium text-orange-800">Total Weight</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-orange-600">{totalWeight}</span>
                      
                    </div>
                  </div>
                  
                  {/* Weight Notification */}
                  {weightNotification && (
                    <div className={`mt-3 p-3 rounded-lg ${
                      weightNotification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
                      weightNotification.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-700' :
                      'bg-blue-50 border border-blue-200 text-blue-700'
                    }`}>
                      <div className="flex items-center">
                        {weightNotification.type === 'success' && <span className="text-green-600 mr-2">✓</span>}
                        {weightNotification.type === 'warning' && <span className="text-yellow-600 mr-2">⚠</span>}
                        {weightNotification.type === 'info' && <span className="text-blue-600 mr-2">ℹ</span>}
                        <span className="text-sm">{weightNotification.message}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Smart Suggestions */}
                  {getWeightSuggestions() && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start">
                        <span className="text-blue-600 mr-2 mt-0.5">💡</span>
                        <div>
                          <span className="text-sm text-blue-700 font-medium">Smart Suggestion:</span>
                          <p className="text-sm text-blue-600 mt-1">{getWeightSuggestions()?.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Auto-adjustment Controls */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={autoAdjustEnabled}
                          onChange={(e) => setAutoAdjustEnabled(e.target.checked)}
                          className="mr-2 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-orange-700">Auto-adjust when over 100%</span>
                      </label>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={balanceWeights}
                        disabled={totalWeight === 100}
                        className="px-3 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Balance to 100%
                      </button>
                    </div>
                  </div>
                </div>

                {/* Removed Weights Section */}
                {Array.from(activeStandardWeights).length < 7 && (
                  <div className="mt-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Back Removed Weights
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'technical_skills_weight', label: 'Technical Skills' },
                        { name: 'soft_skills_weight', label: 'Soft Skills' },
                        { name: 'open_to_work_weight', label: 'Open to Work' },
                        { name: 'job_match_weight', label: 'Job Match' },
                        { name: 'location_match_weight', label: 'Location Match' },
                        { name: 'experience_weight', label: 'Experience' },
                        { name: 'education_weight', label: 'Education' }
                      ].filter(weight => !activeStandardWeights.has(weight.name)).map(weight => (
                        <button
                          key={weight.name}
                          type="button"
                          onClick={() => addStandardWeight(weight.name)}
                          className="px-3 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700 flex items-center"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {weight.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Weights Section */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <h3 className="font-semibold text-purple-900 mb-4 flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Custom Evaluation Weights
                </h3>
                <p className="text-sm text-purple-700 mb-6">
                  Add your own custom evaluation criteria. These will be included in the total weight calculation.
                </p>
                
                {/* Add Custom Weight Form */}
                <div className="bg-white rounded-lg p-4 border border-purple-200 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label htmlFor="custom_weight_name" className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Weight Name
                      </label>
                      <input
                        type="text"
                        id="custom_weight_name"
                        value={newCustomWeight.name}
                        onChange={(e) => setNewCustomWeight({...newCustomWeight, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                        placeholder="e.g., Cultural Fit, Leadership Skills"
                      />
                    </div>
                    <div>
                      <label htmlFor="custom_weight_value" className="block text-sm font-medium text-gray-700 mb-2">
                        Weight
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          id="custom_weight_value"
                          min="1"
                          max="100"
                          value={newCustomWeight.weight}
                          onChange={(e) => setNewCustomWeight({...newCustomWeight, weight: parseInt(e.target.value) || 0})}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 text-center"
                        />
                        
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={addCustomWeight}
                      disabled={!newCustomWeight.name.trim() || newCustomWeight.weight <= 0}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Custom Weight
                    </button>
                  </div>
                </div>

                {/* Custom Weights List */}
                {customWeights.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-purple-800 mb-3">Your Custom Weights:</h4>
                    {customWeights.map((customWeight) => (
                      <div key={customWeight.id} className="bg-white rounded-lg p-4 border border-purple-200 flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <input
                              type="text"
                              value={customWeight.name}
                              onChange={(e) => updateCustomWeight(customWeight.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={customWeight.weight}
                              onChange={(e) => updateCustomWeight(customWeight.id, 'weight', parseInt(e.target.value) || 0)}
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 text-center"
                            />
                            
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCustomWeight(customWeight.id)}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove this custom weight"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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