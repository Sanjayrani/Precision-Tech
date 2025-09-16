'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Phone, MoreHorizontal, Send, User, Building2 } from 'lucide-react'

// Normalize message text so that literal "\n" becomes real newlines and spacing is preserved
const normalizeMessageText = (text: string): string => {
  return (text ?? '')
    .replace(/\r\n?/g, '\n')        // CRLF/CR -> LF
    .replace(/<br\s*\/?\s*>/gi, '\n') // <br> variations -> LF
    .replace(/\\n/g, '\n')          // literal "\n" -> LF
    .replace(/\\t/g, '    ')         // literal "\t" -> 4 spaces
    .replace(/&nbsp;/gi, ' ')          // HTML non-breaking space -> space
    .replace(/&amp;/gi, '&')           // HTML ampersand -> &
    .replace(/&lt;/gi, '<')            // HTML less-than -> <
    .replace(/&gt;/gi, '>')            // HTML greater-than -> >
    .replace(/[ \t]+$/gm, '')         // trim trailing spaces per line
    .replace(/\n{3,}/g, '\n\n')     // collapse 3+ newlines to 2
    .trim()
}

interface Message {
  id: string
  content: string
  timestamp: string
  sender: 'recruiter' | 'candidate'
  senderName: string
  channel?: 'linkedin' | 'mail'
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

interface OverallMessage {
  content: string
  timestamp: string
  sender: 'Recruiter' | 'Candidate'
}

// For handling a single string in overallMessages
type OverallMessages = OverallMessage[] | string

interface Candidate {
  id: string
  candidateName: string
  email: string
  phoneNumber: string
  currentJobTitle: string
  currentEmployer: string
  overallMessages: OverallMessages
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

  // Extract content and metadata from prefixed strings like:
  // "Candidate - LinkedIn : hello" or "Recruiter - Mail : Hi"
  const extractFromPrefixed = (raw: string): { content: string; senderFromPrefix?: 'Recruiter' | 'Candidate'; channel?: 'linkedin' | 'mail' } => {
    if (typeof raw !== 'string') {
      return { content: String(raw ?? '') }
    }
    const re = /^(Recruiter|Candidate)\s*-\s*(LinkedIn|Mail)\s*:\s*(.*)$/i
    const m = raw.match(re)
    if (m) {
      const senderRaw = m[1]
      const channelRaw = m[2]
      const rest = m[3]
      return {
        content: rest?.trim() ?? '',
        senderFromPrefix: senderRaw === 'Recruiter' ? 'Recruiter' : 'Candidate',
        channel: channelRaw.toLowerCase() === 'mail' ? 'mail' : 'linkedin'
      }
    }
    // If there's any colon, take content after the first colon (defensive)
    const colonIdx = raw.indexOf(':')
    if (colonIdx !== -1 && colonIdx < raw.length - 1) {
      return { content: raw.slice(colonIdx + 1).trim() }
    }
    return { content: raw.trim() }
  }

  // Normalize overall messages from various possible API shapes
  type OverallNestedBranch = {
    mail?: OverallMessages
    linkedin?: OverallMessages
  } | OverallMessages

  type OverallNested = {
    Recruiter?: OverallNestedBranch
    Candidate?: OverallNestedBranch
    // Allow other keys but we won't rely on them
    [key: string]: unknown
  }

  type OverallValue = OverallMessages | OverallNested | null

  // Type guard to detect an object with possible channel keys
  const hasChannels = (x: unknown): x is { mail?: OverallMessages; linkedin?: OverallMessages } => {
    return typeof x === 'object' && x !== null && ('mail' in (x as object) || 'linkedin' in (x as object))
  }

  const getOverallMessagesValue = useCallback((candidate: Candidate | Record<string, unknown>): OverallValue => {
    const c = candidate as Record<string, unknown>
    return (
      (c?.overallMessages as OverallValue) ??
      (c?.overall_message as OverallValue) ??
      (c?.overall_messages as OverallValue) ??
      null
    )
  }, [])

  // Process candidates data to create conversations
  useEffect(() => {
    if (candidates && candidates.length > 0) {
      const candidateConversations = candidates
        .filter(candidate => {
          // Only include candidates with actual message data
          const overall = getOverallMessagesValue(candidate)
          if (typeof overall === 'string' && overall.trim() !== '') return true
          if (Array.isArray(overall) && overall.length > 0) return true
          if (overall && typeof overall === 'object') {
            // Check nested Recruiter/Candidate presence with safe guards
            const o = overall as Record<string, unknown>
            if ('Recruiter' in o || 'Candidate' in o) return true
            // Or any keys present
            if (Object.keys(o).length > 0) return true
          }
          return false
        })
        .map(candidate => {
          // Initialize messages array
          const messages: Message[] = []
          
          const overall = getOverallMessagesValue(candidate)

          const defaultTime = new Date(candidate.lastContactedDate).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })

          const pushParsed = (rawContent: unknown, inferredSender?: 'Recruiter' | 'Candidate', channelHint?: 'linkedin' | 'mail') => {
            if (rawContent == null) return
            if (Array.isArray(rawContent)) {
              rawContent.forEach((rc) => pushParsed(rc, inferredSender, channelHint))
              return
            }
            if (typeof rawContent === 'object' && rawContent !== null && 'content' in rawContent) {
              // Already an object with content/timestamp/sender
              const obj = rawContent as { content: string; timestamp?: string; sender?: 'Recruiter' | 'Candidate' }
              const extracted = extractFromPrefixed(obj.content)
              const senderFinal = extracted.senderFromPrefix || obj.sender || inferredSender || 'Recruiter'
              const channelFinal: 'linkedin' | 'mail' = (extracted.channel || channelHint || (/mail|email/i.test(obj.content) ? 'mail' : 'linkedin'))
              messages.push({
                id: `msg-${candidate.id}-${messages.length}`,
                content: normalizeMessageText(extracted.content),
                timestamp: obj.timestamp || defaultTime,
                sender: senderFinal === 'Recruiter' ? 'recruiter' : 'candidate',
                senderName: senderFinal === 'Recruiter' ? 'Recruiter' : candidate.candidateName,
                channel: channelFinal,
                isRead: senderFinal === 'Candidate' ? false : true
              })
              return
            }
            // Treat as string
            const extracted = extractFromPrefixed(String(rawContent))
            const senderFinal = extracted.senderFromPrefix || inferredSender || 'Recruiter'
            const channelFinal: 'linkedin' | 'mail' = (extracted.channel || channelHint || (/mail|email/i.test(String(rawContent)) ? 'mail' : 'linkedin'))
            messages.push({
              id: `msg-${candidate.id}-${messages.length}`,
              content: normalizeMessageText(extracted.content),
              timestamp: defaultTime,
              sender: senderFinal === 'Recruiter' ? 'recruiter' : 'candidate',
              senderName: senderFinal === 'Recruiter' ? 'Recruiter' : candidate.candidateName,
              channel: channelFinal,
              isRead: senderFinal === 'Candidate' ? false : true
            })
          }

          // Handle overall messages by type/shape
          if (typeof overall === 'string') {
            pushParsed(overall)
          } else if (Array.isArray(overall)) {
            overall.forEach((msg: unknown) => pushParsed(msg))
          } else if (overall && typeof overall === 'object') {
            // Nested structure with Recruiter/Candidate keys and possibly channels under them
            const ov = overall as OverallNested
            if (ov.Recruiter != null) {
              const rec = ov.Recruiter
              if (hasChannels(rec)) {
                if (rec.mail != null) pushParsed(rec.mail, 'Recruiter', 'mail')
                if (rec.linkedin != null) pushParsed(rec.linkedin, 'Recruiter', 'linkedin')
              } else {
                pushParsed(rec, 'Recruiter')
              }
            }
            if (ov.Candidate != null) {
              const cand = ov.Candidate
              if (hasChannels(cand)) {
                if (cand.mail != null) pushParsed(cand.mail, 'Candidate', 'mail')
                if (cand.linkedin != null) pushParsed(cand.linkedin, 'Candidate', 'linkedin')
              } else {
                pushParsed(cand, 'Candidate')
              }
            }
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
            unreadCount: messages.filter(m => m.sender === 'candidate' && !m.isRead).length
          }
        })
      
      setConversations(candidateConversations)
      if (candidateConversations.length > 0) {
        setSelectedConversation(candidateConversations[0].id)
      }
    }
  }, [candidates, getOverallMessagesValue])

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
      channel: 'linkedin',
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
              {selectedConv.messages.length > 0 ? (
                selectedConv.messages.map((message) => (
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
                    <div className="text-[10px] mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {message.sender === 'recruiter' ? (
                        <span className="font-bold text-white">Recruiter</span>
                      ) : (
                        <span className="flex items-center font-bold text-white"><User className="h-3 w-3 mr-1" />Candidate</span>
                      )}
                      {message.channel && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] bg-white text-black border ${
                            message.channel === 'linkedin' ? 'border-blue-600' : 'border-amber-500'
                          }`}
                        >
                          {message.channel === 'linkedin' ? 'LinkedIn' : 'Email'}
                        </span>
                      )}
                    </div>
                    <span className="ml-2">{message.timestamp}</span>
                  </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-gray-500">No messages available for this conversation</p>
                    <p className="text-gray-400 text-sm mt-2">Start the conversation by sending a message below</p>
                  </div>
                </div>
              )}
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
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No message data available</h3>
              <p className="text-gray-500">There are no conversations with message data to display</p>
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
