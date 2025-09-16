'use client'

import { useState, useEffect } from 'react'
import { Search, Phone, MoreHorizontal, Send, User, Building2 } from 'lucide-react'

interface Message {
  id: string
  content: string
  timestamp: string
  sender: 'recruiter' | 'candidate'
  senderName: string
  isRead?: boolean
}

interface Conversation {
  id: string
  candidateId: string
  candidateName: string
  jobTitle: string
  contact: string
  taskId: string
  messages: Message[]
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

interface Candidate {
  id: string
  candidateName: string
  email: string
  phoneNumber: string
  currentJobTitle: string
  currentEmployer: string
  overallMessages: unknown[]
  linkedinMessages: number
  emailMessages: number
  lastContactedDate: string
  jobId: string
  linkedinMessage: string
  subject: string
  replyStatus: string
  jobsMapped: string
  job: {
    id: string
    title: string
    companyName: string
  }
}

interface CommunicationInterfaceProps {
  candidates: Candidate[]
  loading: boolean
}

export default function CommunicationInterface({ candidates, loading }: CommunicationInterfaceProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newMessage, setNewMessage] = useState('')

  const [conversations, setConversations] = useState<Conversation[]>([])

  // Process candidates data to create conversations
  useEffect(() => {
    if (candidates && candidates.length > 0) {
      const candidateConversations = candidates
        .filter(candidate => Array.isArray(candidate.overallMessages) && candidate.overallMessages.length > 0)
        .map(candidate => {
          // Generate messages based on overallMessages count
          const messages: Message[] = []
          
          // Add LinkedIn message if available
          if (candidate.linkedinMessage) {
            messages.push({
              id: `linkedin-${candidate.id}`,
              content: candidate.linkedinMessage,
              timestamp: new Date(candidate.lastContactedDate).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }),
              sender: 'recruiter',
              senderName: 'Recruiter',
              isRead: true
            })
          }
          
          // Add email subject as a message if available
          if (candidate.subject) {
            messages.push({
              id: `email-${candidate.id}`,
              content: candidate.subject,
              timestamp: new Date(candidate.lastContactedDate).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }),
              sender: 'recruiter',
              senderName: 'Recruiter',
              isRead: true
            })
          }
          
          // Add reply if candidate has replied
          if (candidate.replyStatus === 'replied') {
            messages.push({
              id: `reply-${candidate.id}`,
              content: 'Thank you for reaching out. I am interested in discussing this opportunity.',
              timestamp: new Date(candidate.lastContactedDate).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }),
              sender: 'candidate',
              senderName: candidate.candidateName,
              isRead: false
            })
          }
          
          const lastMessage = messages[messages.length - 1]
          
          return {
            id: candidate.candidateName, // Use candidate name instead of _id
            candidateId: candidate.id,
            candidateName: candidate.candidateName,
            jobTitle: candidate.currentJobTitle || 'Position',
            contact: candidate.phoneNumber || candidate.email,
            taskId: candidate.job?.title || candidate.jobsMapped || 'Position', // Show only job title
            messages,
            lastMessage: lastMessage?.content || 'No messages',
            lastMessageTime: lastMessage?.timestamp || '',
            unreadCount: candidate.replyStatus === 'replied' ? 1 : 0
          }
        })
      
      setConversations(candidateConversations)
      if (candidateConversations.length > 0) {
        setSelectedConversation(candidateConversations[0].id)
      }
    }
  }, [candidates])

  const filteredConversations = conversations.filter(conv =>
    conv.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedConv = conversations.find(conv => conv.id === selectedConversation)

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return

    const message: Message = {
      id: `msg-${Date.now()}`,
      content: newMessage,
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      sender: 'recruiter',
      senderName: 'You',
      isRead: false
    }

    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation 
        ? { 
            ...conv, 
            messages: [...conv.messages, message],
            lastMessage: newMessage,
            lastMessageTime: message.timestamp
          }
        : conv
    ))

    setNewMessage('')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-blue-600" />
              Candidate Communications
            </h2>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedConversation === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900">{conversation.id}</h3>
                    <span className="text-xs text-gray-500">{conversation.lastMessageTime}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Candidate: {conversation.candidateName}</p>
                  <p className="text-sm text-gray-600 mb-1">Contact: {conversation.contact}</p>
                  <p className="text-sm text-gray-600 mb-1">Job: {conversation.taskId}</p>
                  <p className="text-sm text-gray-500 truncate">{conversation.lastMessage}</p>
                </div>
                {conversation.unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedConv.id}</h3>
                  <p className="text-sm text-gray-600">
                    Candidate: {selectedConv.candidateName} | Contact: {selectedConv.contact}
                  </p>
                  <p className="text-sm text-gray-600">Job: {selectedConv.taskId}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Phone className="h-5 w-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <MoreHorizontal className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConv.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'recruiter' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      message.sender === 'recruiter'
                        ? 'bg-blue-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}
                  >
                    {message.sender === 'recruiter' && (
                      <div className="text-xs opacity-75 mb-1">
                        {message.senderName}
                      </div>
                    )}
                    {message.sender === 'candidate' && (
                      <div className="text-xs opacity-75 mb-1 flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {message.senderName}
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div className="text-xs opacity-75 mt-1 text-right">
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading conversations...</h3>
              <p className="text-gray-500">Fetching candidate communications</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a candidate conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
