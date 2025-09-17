'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'
import { 
  Linkedin, 
  Check, 
  AlertCircle,
  Globe
} from 'lucide-react'

export default function SettingsPage() {
  const [linkedinConnector, setLinkedinConnector] = useState({
    email: '',
    pin: '',
    isConnected: false,
    lastSync: null as string | null
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleLinkedinConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/integrations/linkedin/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: linkedinConnector.email,
          pin: linkedinConnector.pin,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setLinkedinConnector(prev => ({
          ...prev,
          isConnected: true,
          lastSync: new Date().toISOString()
        }))
        setSuccess('LinkedIn connector successfully integrated!')
      } else {
        setError(data.error || 'Failed to connect LinkedIn')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLinkedinDisconnect = async () => {
    setLoading(true)
    try {
      await fetch('/api/integrations/linkedin/disconnect', {
        method: 'POST',
      })
      
      setLinkedinConnector({
        email: '',
        pin: '',
        isConnected: false,
        lastSync: null
      })
      setSuccess('LinkedIn connector disconnected successfully!')
    } catch (error) {
      setError('Failed to disconnect LinkedIn')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setLinkedinConnector(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="text-gray-600 mt-1">Manage your account and integration settings</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-8 px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Settings Navigation */}
            <div className="lg:col-span-1">
              <nav className="space-y-2">
                <a href="#integrations" className="flex items-center px-4 py-3 text-sm font-medium text-indigo-700 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-l-4 border-indigo-500">
                  <Globe className="w-5 h-5 mr-3 text-indigo-600" />
                  Integrations
                </a>
                {/* Hidden nav items removed per request: Profile, Notifications, Security */}
              </nav>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* LinkedIn Integration */}
              <section id="integrations" className="bg-white shadow-lg rounded-xl border border-gray-100">
                <div className="px-6 py-6 border-b border-gray-200">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg mr-4">
                      <Linkedin className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">LinkedIn Connector</h2>
                      <p className="text-gray-600">Connect your LinkedIn account to source candidates automatically</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-6">
                  {success && (
                    <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center">
                      <Check className="w-5 h-5 mr-2" />
                      {success}
                    </div>
                  )}

                  {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      {error}
                    </div>
                  )}

                  {linkedinConnector.isConnected ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <Check className="w-5 h-5 text-green-600 mr-3" />
                          <div>
                            <p className="font-medium text-green-900">LinkedIn Connected</p>
                            <p className="text-sm text-green-700">Account: {linkedinConnector.email}</p>
                            {linkedinConnector.lastSync && (
                              <p className="text-xs text-green-600">
                                Last sync: {new Date(linkedinConnector.lastSync).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={handleLinkedinDisconnect}
                          disabled={loading}
                          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          Disconnect
                        </button>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-900">Integration Features</h4>
                            <ul className="text-sm text-blue-800 mt-2 space-y-1">
                              <li>• Automatic candidate sourcing from LinkedIn</li>
                              <li>• Profile data synchronization</li>
                              <li>• Advanced search capabilities</li>
                              <li>• Bulk candidate import</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleLinkedinConnect} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="linkedin-email" className="block text-sm font-medium text-gray-700 mb-2">
                            LinkedIn Email *
                          </label>
                          <input
                            type="email"
                            id="linkedin-email"
                            required
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                            placeholder="your-email@example.com"
                            value={linkedinConnector.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                          />
                          <p className="mt-1 text-sm text-gray-500">Your LinkedIn account email address</p>
                        </div>

                        <div>
                          <label htmlFor="linkedin-pin" className="block text-sm font-medium text-gray-700 mb-2">
                            Security PIN *
                          </label>
                          <input
                            type="password"
                            id="linkedin-pin"
                            required
                            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base text-gray-900 placeholder-gray-500"
                            placeholder="Enter your PIN"
                            value={linkedinConnector.pin}
                            onChange={(e) => handleInputChange('pin', e.target.value)}
                          />
                          <p className="mt-1 text-sm text-gray-500">6-digit security PIN for authentication</p>
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-yellow-900">Important Security Notice</h4>
                            <p className="text-sm text-yellow-800 mt-1">
                              Your LinkedIn credentials are encrypted and stored securely. We use OAuth 2.0 
                              authentication and never store your actual password. The PIN is used for 
                              additional security verification.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading || !linkedinConnector.email || !linkedinConnector.pin}
                          className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {loading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Connecting...
                            </>
                          ) : (
                            <>
                              <Linkedin className="w-4 h-4 mr-2" />
                              Connect LinkedIn
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </section>

              {/* Additional Integration Placeholders */}
              <section className="bg-white shadow-lg rounded-xl border border-gray-100">
                <div className="px-6 py-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Other Integrations</h2>
                  <p className="text-gray-600">More integrations coming soon</p>
                </div>
                <div className="px-6 py-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg opacity-50">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-gray-200 rounded mr-3"></div>
                        <span className="font-medium text-gray-500">Indeed</span>
                      </div>
                      <p className="text-sm text-gray-400">Coming Soon</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg opacity-50">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-gray-200 rounded mr-3"></div>
                        <span className="font-medium text-gray-500">Glassdoor</span>
                      </div>
                      <p className="text-sm text-gray-400">Coming Soon</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg opacity-50">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-gray-200 rounded mr-3"></div>
                        <span className="font-medium text-gray-500">AngelList</span>
                      </div>
                      <p className="text-sm text-gray-400">Coming Soon</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  )
}
