'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { htmlToPlainText } from '@/lib/formatHtml'
import { useRouter, useSearchParams } from 'next/navigation'
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
  hasMessages: boolean
  messageCount: number
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
  craftedMessage?: string
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
  pageSize?: number
  onPageChange: (page: number) => void
  onSearch?: (query: string) => void
}

export default function CommunicationInterface({ candidates, loading, page, totalPages, totalCount, pageSize = 10, onPageChange, onSearch }: CommunicationInterfaceProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [waMessage, setWaMessage] = useState('')
  const [handledCrafted, setHandledCrafted] = useState<Record<string, { email?: 'approved' | 'rejected'; linkedin?: 'approved' | 'rejected'; whatsapp?: 'approved' | 'rejected' }>>({})

  const [conversations, setConversations] = useState<Conversation[]>([])

  // Sync local search box with URL (?search=...)
  useEffect(() => {
    const q = searchParams.get('search') || ''
    setSearchQuery(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // When user types in search, update URL and reset to page 1. Do nothing if value already matches URL to avoid loops.
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(Array.from(searchParams.entries()))
      const current = params.get('search') || ''
      const next = (searchQuery || '').trim()
      const pageInUrl = params.get('page') || '1'
      if (current !== next || pageInUrl !== '1') {
        if (next.length > 0) params.set('search', next)
        else params.delete('search')
        params.set('page', '1')
        router.replace(`?${params.toString()}`)
      }
    }, 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // Clear any previous conversations immediately while loading to avoid stale UI
  useEffect(() => {
    if (loading) {
      setConversations([])
      setSelectedConversation(null)
    }
  }, [loading])

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
      // Sort: candidates with non-empty overall_messages arrays first; within each group, latest first
      const sortedCandidates = [...candidates].sort((a, b) => {
        const aOverall = getOverallMessagesValue(a)
        const bOverall = getOverallMessagesValue(b)
        const aHas = Array.isArray(aOverall) && aOverall.length > 0
        const bHas = Array.isArray(bOverall) && bOverall.length > 0
        if (aHas !== bHas) return aHas ? -1 : 1
        const aTime = safeParseDate(a.lastContactedDate)?.getTime() || safeParseDate(a.createdAt)?.getTime() || 0
        const bTime = safeParseDate(b.lastContactedDate)?.getTime() || safeParseDate(b.createdAt)?.getTime() || 0
        return bTime - aTime // Latest first
      })

      const candidateConversations = sortedCandidates
        .filter(candidate => {
          // Include all candidates, whether they have messages or not
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
            lastMessage: lastMessage?.content || (messages.length === 0 ? 'No communication history' : 'No messages'),
            lastMessageTime: lastMessage ? formatTimestamp(lastMessage.timestamp) : (candidate.createdAt ? formatTimestamp(candidate.createdAt) : ''),
            unreadCount: messages.filter(m => m.sender === 'candidate' && !m.isRead).length,
            hasMessages: messages.length > 0,
            messageCount: messages.length
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

  // Append a recruiter message (blue bubble) as the latest message in the open chat
  const appendRecruiterMessage = (content: string, channel: 'linkedin' | 'mail' | 'whatsapp' = 'linkedin') => {
    if (!selectedConversation || !content.trim()) return
    const nowIso = new Date().toISOString()
    const msg: Message = {
      id: `msg-${Date.now()}`,
      content,
      timestamp: nowIso,
      sender: 'recruiter',
      senderName: 'You',
      channel,
      isRead: true
    }

    setConversations(prev => prev.map(conv =>
      conv.id === selectedConversation
        ? {
            ...conv,
            messages: [...conv.messages, msg],
            lastMessage: content,
            lastMessageTime: nowIso,
            hasMessages: true,
            messageCount: conv.messageCount + 1
          }
        : conv
    ))
  }

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
      <div className="flex h-full bg-gray-50 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48 animate-pulse"></div>
            </div>
            
            {/* Search Skeleton */}
            <div className="relative">
              <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Candidate List Skeleton */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="p-4 border-b border-gray-100 animate-pulse">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-5 bg-gray-300 rounded w-32"></div>
                    <div className="h-5 bg-orange-200 rounded-full w-20"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Skeleton */}
          <div className="bg-white border-t-2 border-gray-300 p-3 flex-shrink-0">
            <div className="flex flex-col gap-2">
              <div className="h-4 bg-gray-200 rounded w-48 mx-auto animate-pulse"></div>
              <div className="flex items-center justify-between gap-2">
                <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="text-center max-w-md p-8">
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="absolute w-20 h-20 bg-blue-200 rounded-full animate-ping opacity-20"></div>
                <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="h-6 bg-gray-300 rounded w-48 mx-auto animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-64 mx-auto animate-pulse"></div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <p className="text-sm text-gray-600 mt-4 font-medium">Loading candidate communications...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
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
        <div className="flex-1 overflow-y-auto min-h-0">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No candidates to display</div>
          ) : filteredConversations.map((conversation, index) => (
            <div
              key={conversation.candidateId || `${conversation.id}-${index}`}
              onClick={() => setSelectedConversation(conversation.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedConversation === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{conversation.id}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-500 whitespace-nowrap">{conversation.lastMessageTime}</span>
                      {conversation.hasMessages ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {conversation.messageCount}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          <MessageSquare className="h-3.5 w-3.5" />
                          0
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Candidate: {conversation.candidateName}</p>
                  <p className="text-sm text-gray-600 mb-1">
                    Contact: {conversation.contact}
                    {(() => {
                      const cand = candidates.find(c => c.id === conversation.candidateId)
                      // Access without changing TS types
                      const url = cand && (cand as unknown as Record<string, string>)['linkedinUrl']
                      if (!url) return null
                      const href = url.startsWith('http') ? url : `https://${url}`
                      return (
                        <>
                          {' '}|{' '}
                          <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                            LinkedIn
                          </a>
                        </>
                      )
                    })()}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">Job: {conversation.taskId}</p>
                  <p
                    className={`text-sm w-full leading-snug pr-6 ${
                      conversation.hasMessages ? 'text-gray-700' : 'text-gray-500 italic'
                    }`}
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

        {/* Pagination - Fixed at Bottom */}
        {totalCount > 0 && (
          <div className="bg-white border-t-2 border-gray-300 p-3 flex-shrink-0 shadow-sm">
            <div className="flex flex-col gap-2">
              <div className="text-sm text-gray-700 font-medium text-center">
                {(() => {
                  const start = (page - 1) * pageSize + 1
                  const end = Math.min(page * pageSize, totalCount)
                  return `Showing ${start} to ${end} of ${totalCount} candidates`
                })()}
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  aria-label="Previous page"
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <button
                  aria-label="Next page"
                  onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedConv.id}</h3>
                  <p className="text-sm text-gray-600">
                    Candidate: {selectedConv.candidateName} | Contact: {selectedConv.contact}
                    {(() => {
                      const cand = candidates.find(c => c.id === selectedConv.candidateId)
                      const url = cand && (cand as unknown as Record<string, string>)['linkedinUrl']
                      if (!url) return null
                      const href = url.startsWith('http') ? url : `https://${url}`
                      return (
                        <>
                          {' '}|{' '}
                          <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">LinkedIn</a>
                        </>
                      )
                    })()}
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
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
                  <div className="text-center max-w-md">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-6">
                      <MessageSquare className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">No Communication History</h3>
                    <p className="text-gray-600 mb-6">This candidate hasn&apos;t been contacted yet. Start the conversation by sending a message below.</p>
                    <div className="grid grid-cols-1 gap-3 text-sm text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                        Send your first message to this candidate
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                        Track communication status
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                        Build relationship over time
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {(() => {
                const cand = candidates.find(c => c.id === selectedConv.candidateId)
                if (!cand) return null
                const candRec = cand as unknown as Record<string, string>
                const channelRaw = candRec["messageChannel"] || candRec["message_channel"] || candRec["Message_Channel"] || ''
                const channelLower = String(channelRaw).toLowerCase()
                 const emailCraftRaw = String(candRec["craftedMessage"] || candRec["crafted_message"] || candRec["Crafted_Message"] || '').trim()
                 const linkedinCraftRaw = String(candRec["craftedLinkedinMessage"] || candRec["crafted_linkedin_message"] || candRec["Crafted_LinkedIn_Message"] || candRec["craftedLinkedInMessage"] || '').trim()
                 const whatsappCraftRaw = String(candRec["craftedWhatsappMessage"] || candRec["crafted_whatsapp_message"] || candRec["Crafted_WhatsApp_Message"] || candRec["craftedWhatsAppMessage"] || '').trim()

                 const emailCraft = emailCraftRaw ? htmlToPlainText(emailCraftRaw) : ''
                 const linkedinCraft = linkedinCraftRaw ? htmlToPlainText(linkedinCraftRaw) : ''
                 const whatsappCraft = whatsappCraftRaw ? htmlToPlainText(whatsappCraftRaw) : ''
                const liUrlRaw = candRec["linkedinUrl"] || candRec["linkedin"] || candRec["LinkedIn"] || candRec["linkedin_url"] || candRec["linkedinURL"] || ''
                const linkedinUrl = liUrlRaw ? (String(liUrlRaw).startsWith('http') ? String(liUrlRaw) : `https://${String(liUrlRaw)}`) : ''

                const emailHandled = handledCrafted[selectedConv.candidateId]?.email
                const linkedinHandled = handledCrafted[selectedConv.candidateId]?.linkedin
                const whatsappHandled = handledCrafted[selectedConv.candidateId]?.whatsapp

                const hasEmail = channelLower.includes('email') || channelLower.includes('mail')
                const hasLinkedin = channelLower.includes('linkedin')
                const hasWhatsapp = channelLower.includes('whatsapp') || channelLower.includes('whats app') || channelLower.includes('wa')
                const channelMissing = channelLower.trim() === ''
                
                // Show crafted messages only for the channels specified (or all if channel is missing)
                const shouldShowEmail = emailCraft.length > 0 && !emailHandled && (channelMissing || hasEmail)
                const shouldShowLinkedin = linkedinCraft.length > 0 && !linkedinHandled && (channelMissing || hasLinkedin)
                const shouldShowWhatsapp = whatsappCraft.length > 0 && !whatsappHandled && (channelMissing || hasWhatsapp)

                console.log('Crafted Message Debug:', {
                  candidateName: selectedConv.candidateName,
                  channelRaw,
                  channelLower,
                  emailCraft: emailCraft.substring(0, 50),
                  linkedinCraft: linkedinCraft.substring(0, 50),
                  whatsappCraft: whatsappCraft.substring(0, 50),
                  hasEmail,
                  hasLinkedin,
                  hasWhatsapp,
                  channelMissing,
                  shouldShowEmail,
                  shouldShowLinkedin,
                  shouldShowWhatsapp,
                  emailHandled,
                  linkedinHandled,
                  whatsappHandled
                })

                const blocks: React.ReactElement[] = []

                if (shouldShowEmail) {
                  blocks.push(
                    <div key="cm-email" className="flex justify-end">
                      <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-blue-50 text-blue-900 shadow-sm border border-blue-200">
                        <div className="text-[10px] mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-blue-800 text-base">Crafted Email</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white text-amber-700 border border-amber-300 font-medium">Email</span>
                          </div>
                          <span className="ml-2 text-blue-500">{formatTimestamp(new Date().toISOString())}</span>
                        </div>
                        <div className="text-sm whitespace-pre-wrap break-words mb-3 bg-white/70 p-3 rounded border border-blue-200">{linkifyText(emailCraft)}</div>
                        <div className="flex gap-2 justify-end">
                           <button title="Approve" aria-label="Approve crafted email" onClick={async () => {
                             try {
                               if (!linkedinUrl) { alert('LinkedIn URL not available for this candidate'); return }
                               await fetch('/api/communications/message-sender', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ linkedinUrl, sending_status: 'accept', candidateId: selectedConv.candidateId, candidateName: selectedConv.candidateName, channel: 'email' }) })
                             } catch (e) { console.error('Failed to trigger message sender (accept-email)', e) }
                             setNewMessage(emailCraft)
                             appendRecruiterMessage(emailCraft, 'mail')
                             setHandledCrafted(prev => ({ ...prev, [selectedConv.candidateId]: { ...(prev[selectedConv.candidateId] || {}), email: 'approved' } }))
                           }} className="p-2 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors shadow-sm flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                          <button title="Reject" aria-label="Reject crafted email" onClick={async () => {
                            try {
                              if (!linkedinUrl) { alert('LinkedIn URL not available for this candidate'); return }
                              await fetch('/api/communications/message-sender', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ linkedinUrl, sending_status: 'reject', candidateId: selectedConv.candidateId, candidateName: selectedConv.candidateName, channel: 'email' }) })
                            } catch (e) { console.error('Failed to trigger message sender (reject-email)', e) }
                            setNewMessage('')
                            setHandledCrafted(prev => ({ ...prev, [selectedConv.candidateId]: { ...(prev[selectedConv.candidateId] || {}), email: 'rejected' } }))
                          }} className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors shadow-sm flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                }

                if (shouldShowLinkedin) {
                  blocks.push(
                    <div key="cm-linkedin" className="flex justify-end">
                      <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-blue-50 text-blue-900 shadow-sm border border-blue-200">
                        <div className="text-[10px] mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-blue-800 text-base">Crafted LinkedIn</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white text-blue-600 border border-blue-300 font-medium">LinkedIn</span>
                          </div>
                          <span className="ml-2 text-blue-500">{formatTimestamp(new Date().toISOString())}</span>
                        </div>
                        <div className="text-sm whitespace-pre-wrap break-words mb-3 bg-white/70 p-3 rounded border border-blue-200">{linkifyText(linkedinCraft)}</div>
                        <div className="flex gap-2 justify-end">
                           <button title="Approve" aria-label="Approve crafted linkedin" onClick={async () => {
                             try {
                               if (!linkedinUrl) { alert('LinkedIn URL not available for this candidate'); return }
                               await fetch('/api/communications/message-sender', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ linkedinUrl, sending_status: 'accept', candidateId: selectedConv.candidateId, candidateName: selectedConv.candidateName, channel: 'linkedin' }) })
                             } catch (e) { console.error('Failed to trigger message sender (accept-linkedin)', e) }
                             setNewMessage(linkedinCraft)
                             appendRecruiterMessage(linkedinCraft, 'linkedin')
                             setHandledCrafted(prev => ({ ...prev, [selectedConv.candidateId]: { ...(prev[selectedConv.candidateId] || {}), linkedin: 'approved' } }))
                           }} className="p-2 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors shadow-sm flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                          <button title="Reject" aria-label="Reject crafted linkedin" onClick={async () => {
                            try {
                              if (!linkedinUrl) { alert('LinkedIn URL not available for this candidate'); return }
                              await fetch('/api/communications/message-sender', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ linkedinUrl, sending_status: 'reject', candidateId: selectedConv.candidateId, candidateName: selectedConv.candidateName, channel: 'linkedin' }) })
                            } catch (e) { console.error('Failed to trigger message sender (reject-linkedin)', e) }
                            setNewMessage('')
                            setHandledCrafted(prev => ({ ...prev, [selectedConv.candidateId]: { ...(prev[selectedConv.candidateId] || {}), linkedin: 'rejected' } }))
                          }} className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors shadow-sm flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                }

                if (shouldShowWhatsapp) {
                  blocks.push(
                    <div key="cm-whatsapp" className="flex justify-end">
                      <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-blue-50 text-blue-900 shadow-sm border border-blue-200">
                        <div className="text-[10px] mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-blue-800 text-base">Crafted WhatsApp</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white text-green-600 border border-green-300 font-medium">WhatsApp</span>
                          </div>
                          <span className="ml-2 text-blue-500">{formatTimestamp(new Date().toISOString())}</span>
                        </div>
                        <div className="text-sm whitespace-pre-wrap break-words mb-3 bg-white/70 p-3 rounded border border-blue-200">{linkifyText(whatsappCraft)}</div>
                        <div className="flex gap-2 justify-end">
                           <button title="Approve" aria-label="Approve crafted whatsapp" onClick={async () => {
                             try {
                               if (!linkedinUrl) { alert('LinkedIn URL not available for this candidate'); return }
                               await fetch('/api/communications/message-sender', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ linkedinUrl, sending_status: 'accept', candidateId: selectedConv.candidateId, candidateName: selectedConv.candidateName, channel: 'whatsapp' }) })
                             } catch (e) { console.error('Failed to trigger message sender (accept-whatsapp)', e) }
                             setNewMessage(whatsappCraft)
                             appendRecruiterMessage(whatsappCraft, 'whatsapp')
                             setHandledCrafted(prev => ({ ...prev, [selectedConv.candidateId]: { ...(prev[selectedConv.candidateId] || {}), whatsapp: 'approved' } }))
                           }} className="p-2 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors shadow-sm flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                          <button title="Reject" aria-label="Reject crafted whatsapp" onClick={async () => {
                            try {
                              if (!linkedinUrl) { alert('LinkedIn URL not available for this candidate'); return }
                              await fetch('/api/communications/message-sender', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ linkedinUrl, sending_status: 'reject', candidateId: selectedConv.candidateId, candidateName: selectedConv.candidateName, channel: 'whatsapp' }) })
                            } catch (e) { console.error('Failed to trigger message sender (reject-whatsapp)', e) }
                            setNewMessage('')
                            setHandledCrafted(prev => ({ ...prev, [selectedConv.candidateId]: { ...(prev[selectedConv.candidateId] || {}), whatsapp: 'rejected' } }))
                          }} className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors shadow-sm flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                }

                if (blocks.length === 0) return null
                return <>{blocks}</>
              })()}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
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
