import { Sparkles } from 'lucide-react'

export default function SuggestedQuestions({ questions, onSelect }) {
  if (!questions || questions.length === 0) return null

  return (
    <div className="flex flex-col items-center gap-3 mt-6">
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
        <Sparkles className="w-3.5 h-3.5" />
        Try asking
      </div>
      <div className="flex flex-wrap justify-center gap-2 max-w-md">
        {questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(q)}
            className="text-sm text-left px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}