import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Send, Loader2, FileText, Sparkles, UploadCloud, RotateCcw, Plus } from 'lucide-react'
import ChatMessage from './ChatMessage.jsx'
import SuggestedQuestions from './SuggestedQuestions.jsx'
import { streamChatMessage, getSuggestedQuestions, getConversationMessages } from '../services/api.js'

const ChatBox = forwardRef(function ChatBox(
  { hasDocuments, uploadedFiles = [], conversationId, onConversationCreated, onGoToDocuments, onResetDocuments, onNewChat, userName },
  ref
) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [scopeFilename, setScopeFilename] = useState('')
  const [suggestedQuestions, setSuggestedQuestions] = useState([])
  const bottomRef = useRef(null)
  const lastFileCountRef = useRef(0)
  const activeConversationRef = useRef(conversationId)

  useEffect(() => {
    activeConversationRef.current = conversationId
  }, [conversationId])

  useEffect(() => {
    if (conversationId == null) {
      setMessages([])
      return
    }

    getConversationMessages(conversationId)
      .then((data) => {
        const rows = data.messages || []
        const hydrated = rows.flatMap((row) => [
          { role: 'user', content: row.query },
          { role: 'assistant', content: row.answer, confidence: row.confidence, historyId: row.id, sources: [] },
        ])
        setMessages(hydrated)
      })
      .catch(() => setMessages([]))
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (uploadedFiles.length > 0 && uploadedFiles.length !== lastFileCountRef.current && messages.length === 0) {
      const latestFile = uploadedFiles[uploadedFiles.length - 1]
      lastFileCountRef.current = uploadedFiles.length
      getSuggestedQuestions(latestFile.filename)
        .then((data) => setSuggestedQuestions(data.questions || []))
        .catch(() => setSuggestedQuestions([]))
    }
  }, [uploadedFiles, messages.length])

  useImperativeHandle(ref, () => ({
    exportChat: () => {
      if (messages.length === 0) return
      const lines = messages.map((m) => {
        const speaker = m.role === 'user' ? 'You' : 'Assistant'
        return `${speaker}: ${m.content}`
      })
      const blob = new Blob([lines.join('\n\n')], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-export-${Date.now()}.txt`
      a.click()
      URL.revokeObjectURL(url)
    },
    clearChat: () => {
      setMessages([])
    },
  }))

  const sendQuery = async (query) => {
    if (!query || loading) return

    const userMessage = { role: 'user', content: query }
    const updatedMessages = [...messages, userMessage]
    const history = updatedMessages
      .slice(-7, -1)
      .map((m) => ({ role: m.role, content: m.content }))

    setMessages([...updatedMessages, { role: 'assistant', content: '', sources: [], confidence: 0, streaming: true }])
    setInput('')
    setLoading(true)

    let accumulatedText = ''
    const documentFilter = scopeFilename ? [scopeFilename] : null

    await streamChatMessage(
      query,
      history,
      documentFilter,
      activeConversationRef.current,
      (newConversationId) => {
        if (activeConversationRef.current == null) {
          activeConversationRef.current = newConversationId
          onConversationCreated?.(newConversationId)
        }
      },
      (token) => {
        accumulatedText += token
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { ...next[next.length - 1], content: accumulatedText }
          return next
        })
      },
      (sources, confidence, historyId, relatedQuestions) => {
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = {
            ...next[next.length - 1],
            sources, confidence, historyId,
            relatedQuestions: relatedQuestions || [],
            streaming: false,
          }
          return next
        })
        setLoading(false)
      },
      () => {
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = {
            role: 'assistant',
            content: accumulatedText || 'Something went wrong while fetching the answer. Please try again.',
            sources: [],
            confidence: 0,
            streaming: false,
          }
          return next
        })
        setLoading(false)
      }
    )
  }

  const handleSend = () => sendQuery(input.trim())

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0B0F19]">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-secondary-500 flex items-center justify-center mb-5 shadow-glow">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-white mb-2 text-center">
              What would you like to know today?
            </h1>
            <p className="text-gray-500 text-sm mb-8 text-center">
              {hasDocuments ? 'Ask a question about your uploaded documents.' : 'Upload a file to get started.'}
            </p>

            <div className="w-full max-w-2xl">
              <div className="flex items-end gap-2 glass-card rounded-2xl p-2 shadow-glass">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your documents..."
                  className="flex-1 resize-none bg-transparent text-gray-100 placeholder:text-gray-600 px-3 py-2.5 text-sm focus:outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="bg-gradient-to-r from-brand-500 to-secondary-500 disabled:opacity-30 text-white rounded-xl p-2.5 transition shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <QuickAction icon={UploadCloud} label="Upload Document" onClick={onGoToDocuments} />
                <QuickAction icon={RotateCcw} label="Reset Documents" onClick={onResetDocuments} />
                <QuickAction icon={Plus} label="New Chat" onClick={onNewChat} />
              </div>
            </div>

            <SuggestedQuestions questions={suggestedQuestions} onSelect={sendQuery} />
          </div>
        ) : (
          <div className="p-6 space-y-6 max-w-3xl mx-auto">
            {messages.map((msg, idx) => (
              <ChatMessage key={idx} message={msg} onSelectQuestion={sendQuery} />
            ))}

            {loading && messages[messages.length - 1]?.content === '' && (
              <div className="flex items-center gap-2 text-gray-500 text-sm pl-11">
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking...
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {messages.length > 0 && (
        <div className="border-t border-white/[0.08] bg-[#0B0F19] p-4">
          <div className="max-w-3xl mx-auto">
            {uploadedFiles.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <select
                  value={scopeFilename}
                  onChange={(e) => setScopeFilename(e.target.value)}
                  className="text-xs bg-white/[0.04] text-gray-400 border border-white/[0.08] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500 max-w-full truncate"
                >
                  <option value="">Search all documents</option>
                  {uploadedFiles.map((f) => (
                    <option key={f.filename} value={f.filename}>Only: {f.filename}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-end gap-2 glass-card rounded-2xl p-2">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask something about your documents..."
                className="flex-1 resize-none bg-transparent text-gray-100 placeholder:text-gray-600 px-3 py-2.5 text-sm focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-brand-500 to-secondary-500 disabled:opacity-30 text-white rounded-xl p-2.5 transition shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 border border-white/[0.08] hover:border-white/20 rounded-full px-3 py-1.5 transition"
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}

export default ChatBox