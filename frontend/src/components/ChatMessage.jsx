import { useState } from 'react'
import { Bot, User, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react'
import ConfidenceBadge from './ConfidenceBadge.jsx'
import CitationCard from './CitationCard.jsx'
import RelatedQuestions from './RelatedQuestions.jsx'
import { sendFeedback } from '../services/api.js'

export default function ChatMessage({ message, onSelectQuestion }) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [feedbackGiven, setFeedbackGiven] = useState(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  const handleFeedback = async (helpful) => {
    if (!message.historyId || feedbackGiven) return
    setFeedbackGiven(helpful ? 'up' : 'down')
    try {
      await sendFeedback(message.historyId, helpful)
    } catch {}
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
          ${isUser
            ? 'bg-gradient-to-br from-brand-500 to-secondary-500'
            : 'bg-gradient-to-br from-secondary-500 to-accent-500'}`}
      >
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>

      <div className={`max-w-2xl ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        <div className="group relative">
          <div
            className={`rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap
              ${isUser
                ? 'bg-gradient-to-br from-brand-500 to-secondary-500 text-white rounded-tr-sm shadow-glow'
                : 'glass-card text-gray-100 rounded-tl-sm shadow-glass'}`}
          >
            {message.content}
          </div>

          {!isUser && (
            <button
              onClick={handleCopy}
              className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition bg-white/[0.06] backdrop-blur-xs border border-white/[0.08] rounded-full p-1 shadow-sm"
              title="Copy answer"
            >
              {copied ? <Check className="w-3 h-3 text-accent-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
          )}
        </div>

        {!isUser && message.confidence !== undefined && (
          <div className="flex items-center gap-2">
            <ConfidenceBadge score={message.confidence} />
            {message.historyId && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleFeedback(true)}
                  disabled={!!feedbackGiven}
                  className={`p-1 rounded transition ${feedbackGiven === 'up' ? 'text-accent-400' : 'text-gray-600 hover:text-accent-400'}`}
                  title="Helpful"
                >
                  <ThumbsUp className="w-3.5 h-3.5" fill={feedbackGiven === 'up' ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  disabled={!!feedbackGiven}
                  className={`p-1 rounded transition ${feedbackGiven === 'down' ? 'text-red-400' : 'text-gray-600 hover:text-red-400'}`}
                  title="Not helpful"
                >
                  <ThumbsDown className="w-3.5 h-3.5" fill={feedbackGiven === 'down' ? 'currentColor' : 'none'} />
                </button>
              </div>
            )}
          </div>
        )}

        {!isUser && message.sources?.length > 0 && (
          <div className="w-full space-y-2 mt-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sources</p>
            {message.sources.map((source, idx) => (
              <CitationCard key={idx} source={source} />
            ))}
          </div>
        )}

        {!isUser && message.relatedQuestions?.length > 0 && (
          <RelatedQuestions questions={message.relatedQuestions} onSelect={(q) => onSelectQuestion?.(q)} />
        )}
      </div>
    </div>
  )
}