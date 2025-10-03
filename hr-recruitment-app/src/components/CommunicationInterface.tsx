'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { Search, Phone, MoreHorizontal, Send, User, Building2, MessageSquare } from 'lucide-react'

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

// Safely parse a date-like value into a Date, or return null
const safeParseDate = (value?: string | number | Date | null): Date | null => {
  if (!value) return null
  const d = value instanceof Date ? new Date(value.getTime()) : new Date(value)
  return isNaN(d.getTime()) ? null : d
}

// Pick the best available date: message -> candidate.lastContactedDate -> now
const pickBestDate = (primary?: string | number | Date | null, fallback?: string | number | Date | null): Date => {
  return safeParseDate(primary) ?? safeParseDate(fallback) ?? new Date()
}

// Format a timestamp string for display (e.g., "16 Sep 2025, 2:45 PM")
const formatTimestamp = (ts?: string): string => {
  const d = safeParseDate(ts)
  const date = d ?? new Date()
  return date.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

// Turn raw URLs and emails into clickable links (without duplicating matches)
const linkifyText = (text: string) => {
  const input = text ?? ''
  const pattern = /(https?:\/\/[^\s<]+|www\.[^\s<]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/gi
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let lastLinkedTokenLower: string | null = null

  while ((match = pattern.exec(input)) !== null) {
    const start = match.index
    const end = start + match[0].length
    const between = input.slice(lastIndex, start)

    const token = match[0]
    const tokenLower = token.toLowerCase()

    // If the previous item was the same link and the gap is only whitespace or punctuation, skip duplicate
    if (
      lastLinkedTokenLower &&
      lastLinkedTokenLower === tokenLower &&
      /^[\s.,;:()\[\]{}<>"'!\-]*$/.test(between)
    ) {
      lastIndex = end
      continue
    }

    if (between) nodes.push(between)

    if (/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/i.test(token)) {
      nodes.push(
        <a key={`e-${start}`} href={`mailto:${token}`} className="underline" target="_blank" rel="noreferrer noopener">
          {token}
        </a>
      )
    } else {
      const href = tokenLower.startsWith('http') ? token : `https://${token}`
      nodes.push(
        <a key={`u-${start}`} href={href} className="underline" target="_blank" rel="noreferrer noopener">
          {token}
        </a>
      )
    }

    lastLinkedTokenLower = tokenLower
    lastIndex = end
  }

  if (lastIndex < input.length) {
    nodes.push(input.slice(lastIndex))
  }
  return nodes
}

interface Message {
  id: string
  content: string
  timestamp: string
  sender: 'recruiter' | 'candidate'
  senderName: string
  channel?: 'linkedin' | 'mail' | 'whatsapp'
  tag?: string
  isRead?: boolean
}

interface Conversation {
  id: string
  candidateId: string
  candidateName: string
  jobTitle: string
  contact: string
  phone?: string
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
  createdAt: string
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
  page: number
  totalPages: number
  totalCount: number
  onPageChange: (page: number) => void
}

export default function CommunicationInterface({ candidates, loading, page, totalPages, totalCount, onPageChange }: CommunicationInterfaceProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [waMessage, setWaMessage] = useState('')

  const [conversations, setConversations] = useState<Conversation[]>([])

  // Extract content and metadata from prefixed strings like:
  // "Candidate - LinkedIn : hello" or "Recruiter - Mail : Hi"
  const extractFromPrefixed = (raw: string): { content: string; senderFromPrefix?: 'Recruiter' | 'Candidate'; channel?: 'linkedin' | 'mail' | 'whatsapp'; followUp?: boolean } => {
    if (typeof raw !== 'string') {
      return { content: String(raw ?? '') }
    }
    // Accept optional trailing "- Follow Up" segment before colon
    const re = /^(Recruiter|Candidate)\s*-\s*(LinkedIn|Mail|WhatsApp)(?:\s*-\s*Follow\s*Up)?\s*:\s*(.*)$/i
    const m = raw.match(re)
    if (m) {
      const senderRaw = m[1]
      const channelRaw = m[2]
      const rest = m[3]
      const followUp = /-\s*Follow\s*Up\s*:/i.test(raw)
      return {
        content: rest?.trim() ?? '',
        senderFromPrefix: senderRaw === 'Recruiter' ? 'Recruiter' : 'Candidate',
        channel: channelRaw.toLowerCase() === 'mail' ? 'mail' : channelRaw.toLowerCase() === 'whatsapp' ? 'whatsapp' : 'linkedin',
        followUp
      }
    }
    // Heuristic: look at the prefix before the first ':' to infer sender/channel even with non-standard hyphens/spaces
    const firstColon = raw.indexOf(':')
    if (firstColon !== -1) {
      const prefix = raw.slice(0, firstColon).toLowerCase()
      let inferredSender: 'Recruiter' | 'Candidate' | undefined
      if (prefix.includes('candidate')) inferredSender = 'Candidate'
      else if (prefix.includes('recruiter')) inferredSender = 'Recruiter'
      let inferredChannel: 'linkedin' | 'mail' | 'whatsapp' | undefined
      if (prefix.includes('mail') || prefix.includes('email')) inferredChannel = 'mail'
      else if (prefix.includes('whatsapp') || prefix.includes('whats app') || prefix.includes('wa')) inferredChannel = 'whatsapp'
      else if (prefix.includes('linkedin') || prefix.includes('linked in')) inferredChannel = 'linkedin'
      const followUp = /follow\s*up/i.test(prefix)
      return {
        content: raw.slice(firstColon + 1).trim(),
        senderFromPrefix: inferredSender,
        channel: inferredChannel,
        followUp
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
  whatsapp?: OverallMessages
  } | OverallMessages

  type OverallNested = {
    Recruiter?: OverallNestedBranch
    Candidate?: OverallNestedBranch
    // Allow other keys but we won't rely on them
    [key: string]: unknown
  }

  type OverallValue = OverallMessages | OverallNested | null

  // Type guard to detect an object with possible channel keys
  const hasChannels = (x: unknown): x is { mail?: OverallMessages; linkedin?: OverallMessages; whatsapp?: OverallMessages } => {
    return typeof x === 'object' && x !== null && ('mail' in (x as object) || 'linkedin' in (x as object) || 'whatsapp' in (x as object))
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
      // Sort candidates by latest first (lastContactedDate, then createdAt)
      const sortedCandidates = [...candidates].sort((a, b) => {
        const aTime = safeParseDate(a.lastContactedDate)?.getTime() || safeParseDate(a.createdAt)?.getTime() || 0
        const bTime = safeParseDate(b.lastContactedDate)?.getTime() || safeParseDate(b.createdAt)?.getTime() || 0
        return bTime - aTime // Latest first
      })

      const candidateConversations = sortedCandidates
        .filter(candidate => {
          // All candidates from the API already have valid overall_messages
          return true
        })
        .map(candidate => {
          // Initialize messages array
          const messages: Message[] = []
          
          const overall = getOverallMessagesValue(candidate)
          const defaultDate = pickBestDate(candidate.lastContactedDate)

          const pushParsed = (rawContent: unknown, inferredSender?: 'Recruiter' | 'Candidate', channelHint?: 'linkedin' | 'mail' | 'whatsapp') => {
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
              const channelFinal: 'linkedin' | 'mail' | 'whatsapp' = (extracted.channel || channelHint || (/mail|email/i.test(obj.content) ? 'mail' : (/whatsapp|whats\s*app|\bwa\b/i.test(obj.content) ? 'whatsapp' : 'linkedin')))
              const tsDate = pickBestDate(obj.timestamp, defaultDate)
              const tagLabel = extracted.followUp
                ? (channelFinal === 'mail' ? 'mail follow up' : channelFinal === 'whatsapp' ? 'whatsapp follow up' : 'linkedin follow up')
                : undefined
              messages.push({
                id: `msg-${candidate.id}-${messages.length}`,
                content: normalizeMessageText(extracted.content),
                timestamp: tsDate.toISOString(),
                sender: senderFinal === 'Recruiter' ? 'recruiter' : 'candidate',
                senderName: senderFinal === 'Recruiter' ? 'Recruiter' : candidate.candidateName,
                channel: channelFinal,
                tag: tagLabel,
                isRead: senderFinal === 'Candidate' ? false : true
              })
              return
            }
            // Treat as string
            const extracted = extractFromPrefixed(String(rawContent))
            const senderFinal = extracted.senderFromPrefix || inferredSender || 'Recruiter'
            const channelFinal: 'linkedin' | 'mail' | 'whatsapp' = (extracted.channel || channelHint || (/mail|email/i.test(String(rawContent)) ? 'mail' : (/whatsapp|whats\s*app|\bwa\b/i.test(String(rawContent)) ? 'whatsapp' : 'linkedin')))
            const tsDate = defaultDate
            const tagLabel = extracted.followUp
              ? (channelFinal === 'mail' ? 'mail follow up' : channelFinal === 'whatsapp' ? 'whatsapp follow up' : 'linkedin follow up')
              : undefined
            messages.push({
              id: `msg-${candidate.id}-${messages.length}`,
              content: normalizeMessageText(extracted.content),
              timestamp: tsDate.toISOString(),
              sender: senderFinal === 'Recruiter' ? 'recruiter' : 'candidate',
              senderName: senderFinal === 'Recruiter' ? 'Recruiter' : candidate.candidateName,
              channel: channelFinal,
              tag: tagLabel,
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
                if ((rec as Record<string, unknown>).whatsapp != null) pushParsed((rec as Record<string, unknown>).whatsapp, 'Recruiter', 'whatsapp')
              } else {
                pushParsed(rec, 'Recruiter')
              }
            }
            if (ov.Candidate != null) {
              const cand = ov.Candidate
              if (hasChannels(cand)) {
                if (cand.mail != null) pushParsed(cand.mail, 'Candidate', 'mail')
                if (cand.linkedin != null) pushParsed(cand.linkedin, 'Candidate', 'linkedin')
                if ((cand as Record<string, unknown>).whatsapp != null) pushParsed((cand as Record<string, unknown>).whatsapp, 'Candidate', 'whatsapp')
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
            phone: candidate.phoneNumber || '',
            taskId: candidate.job?.title || candidate.jobsMapped || 'Position', // Show only job title
            messages,
            lastMessage: lastMessage?.content || 'No messages',
            lastMessageTime: lastMessage ? formatTimestamp(lastMessage.timestamp) : '',
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
      timestamp: new Date().toISOString(),
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

  if (loading) {
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
                placeholder="Search candidates by name, email, or job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-black"
                disabled
              />
            </div>
          </div>

          {/* Loading State with Skeleton */}
          <div className="flex-1 p-4 space-y-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Communications</h3>
              <p className="text-sm text-gray-600">Fetching candidate conversations...</p>
            </div>
            
            {/* Skeleton Loaders */}
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-28"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Welcome to Communications</h3>
              <p className="text-gray-600 mb-6">Select a candidate from the sidebar to view and manage your conversations</p>
              <div className="grid grid-cols-1 gap-3 text-sm text-gray-500">
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  View conversation history
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Send new messages
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Track communication status
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
              placeholder="Search candidates by name, email, or job title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-black"
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900">{conversation.id}</h3>
                    <span className="text-xs text-gray-500 ml-2 shrink-0 whitespace-nowrap">{conversation.lastMessageTime}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Candidate: {conversation.candidateName}</p>
                  <p className="text-sm text-gray-600 mb-1">Contact: {conversation.contact}</p>
                  <p className="text-sm text-gray-600 mb-1">Job: {conversation.taskId}</p>
                  <p
                    className="text-sm text-gray-500 w-full leading-snug pr-6"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {conversation.lastMessage}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, totalCount)} of {totalCount} candidates
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {(() => {
                  const maxVisiblePages = 5
                  const halfVisible = Math.floor(maxVisiblePages / 2)
                  
                  let startPage = Math.max(1, page - halfVisible)
                  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
                  
                  // Adjust start if we're near the end
                  if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1)
                  }
                  
                  const pages = []
                  
                  // Add first page and ellipsis if needed
                  if (startPage > 1) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => onPageChange(1)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        1
                      </button>
                    )
                    if (startPage > 2) {
                      pages.push(
                        <span key="ellipsis-start" className="px-3 py-1 text-sm text-gray-500">
                          ...
                        </span>
                      )
                    }
                  }
                  
                  // Add visible page range
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => onPageChange(i)}
                        className={`px-3 py-1 text-sm border rounded-md ${
                          page === i
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {i}
                      </button>
                    )
                  }
                  
                  // Add ellipsis and last page if needed
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(
                        <span key="ellipsis-end" className="px-3 py-1 text-sm text-gray-500">
                          ...
                        </span>
                      )
                    }
                    pages.push(
                      <button
                        key={totalPages}
                        onClick={() => onPageChange(totalPages)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        {totalPages}
                      </button>
                    )
                  }
                  
                  return pages
                })()}
                
                <button
                  onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
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
                  <button
                    className={`ml-2 px-3 py-1 rounded-lg flex items-center ${selectedConv.phone ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                    onClick={() => {
                      if (!selectedConv.phone) return
                      setWaMessage('')
                      setShowWhatsAppModal(true)
                    }}
                    title="Send WhatsApp"
                    disabled={!selectedConv.phone}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" /> WhatsApp
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
                        <span className="font-bold text-white text-base">Recruiter</span>
                      ) : (
                        <span className="flex items-center font-bold text-white text-base"><User className="h-4 w-4 mr-1" />Candidate</span>
                      )}
                      {message.channel && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] bg-white text-black border ${
                            message.channel === 'linkedin'
                              ? 'border-blue-600'
                              : message.channel === 'whatsapp'
                                ? 'border-green-600'
                                : 'border-amber-500'
                          }`}
                        >
                          {message.tag
                            ? message.tag
                            : message.channel === 'linkedin'
                              ? 'LinkedIn'
                              : message.channel === 'whatsapp'
                                ? 'WhatsApp'
                                : 'Email'}
                        </span>
                      )}
                    </div>
                    <span className="ml-2">{formatTimestamp(message.timestamp)}</span>
                  </div>
                    <p className="text-sm whitespace-pre-wrap break-words">{linkifyText(message.content)}</p>
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
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
                <MessageSquare className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No Communications Found</h3>
              <p className="text-gray-600 mb-6">There are no candidates with message data to display at the moment</p>
              <div className="grid grid-cols-1 gap-3 text-sm text-gray-500">
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  Check if candidates have been sourced
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  Verify overall_messages data exists
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  Try refreshing the page
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Select a Conversation</h3>
              <p className="text-gray-600 mb-6">Choose a candidate from the sidebar to view and manage your conversations</p>
              <div className="grid grid-cols-1 gap-3 text-sm text-gray-500">
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  View conversation history
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Send new messages
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Track communication status
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Modal */}
        {showWhatsAppModal && selectedConv && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowWhatsAppModal(false)} />
            <div className="relative bg-white w-full max-w-lg rounded-xl shadow-xl p-6">
              <h4 className="text-lg font-semibold mb-4 text-black">Send WhatsApp Message</h4>
              <div className="space-y-3 mb-4">
                <div className="text-sm text-gray-600">
                  To: <span className="font-medium">{selectedConv.candidateName}</span> — <span>{selectedConv.phone || 'No phone'}</span>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Message</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-2 h-28 focus:ring-2 focus:ring-green-600 focus:border-green-600 placeholder-gray-400 text-gray-900"
                    value={waMessage}
                    onChange={(e) => setWaMessage(e.target.value)}
                    placeholder="Type your WhatsApp message..."
                  />
                </div>
                {!selectedConv.phone && (
                  <div className="text-sm text-red-600">Don&apos;t have contact number to send WhatsApp message</div>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowWhatsAppModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 rounded-lg ${selectedConv.phone ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                  onClick={async () => {
                    try {
                      if (!selectedConv.phone) {
                        alert("Don't have contact number to send WhatsApp message")
                        return
                      }
                      const res = await fetch('/api/communications/whatsapp-send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          candidate_name: selectedConv.candidateName,
                          candidate_phone: selectedConv.phone,
                          job_title: selectedConv.jobTitle,
                          message: waMessage,
                        }),
                      })
                      if (!res.ok) throw new Error('Failed to trigger WhatsApp sender')
                      setShowWhatsAppModal(false)
                    } catch (err) {
                      console.error(err)
                      alert('Failed to trigger WhatsApp sender')
                    }
                  }}
                  disabled={!selectedConv.phone}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
