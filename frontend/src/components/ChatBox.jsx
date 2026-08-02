import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Send, Loader2, FileText } from 'lucide-react'
import ChatMessage from './ChatMessage.jsx'
import SuggestedQuestions from './SuggestedQuestions.jsx'
import { streamChatMessage, getSuggestedQuestions, getConversationMessages } from '../services/api.js'

const ChatBox = forwardRef(function ChatBox(
  { hasDocuments, uploadedFiles = [], conversationId, onConversationCreated },
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
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {hasDocuments ? 'Ask a question about your uploaded documents.' : 'Upload a file from the sidebar to get started.'}
            </p>
            <SuggestedQuestions questions={suggestedQuestions} onSelect={sendQuery} />
          </div>
        )}

        {messages.map((msg, idx) => (
          <ChatMessage key={idx} message={msg} onSelectQuestion={sendQuery} />
        ))}

        {loading && messages[messages.length - 1]?.content === '' && (
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm pl-11">
            <Loader2 className="w-4 h-4 animate-spin" />
            Thinking...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="max-w-3xl mx-auto">
          {uploadedFiles.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
              <select
                value={scopeFilename}
                onChange={(e) => setScopeFilename(e.target.value)}
                className="text-xs bg-transparent text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500 max-w-full truncate"
              >
                <option value="">Search all documents</option>
                {uploadedFiles.map((f) => (
                  <option key={f.filename} value={f.filename}>Only: {f.filename}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask something about your documents..."
              className="flex-1 resize-none border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-xl p-2.5 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

export default ChatBox