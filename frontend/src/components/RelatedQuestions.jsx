import { CornerDownRight } from 'lucide-react'

export default function RelatedQuestions({ questions, onSelect }) {
  if (!questions || questions.length === 0) return null

  return (
    <div className="w-full space-y-1.5 mt-1">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">You may also ask</p>
      <div className="flex flex-col gap-1">
        {questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(q)}
            className="flex items-center gap-1.5 text-left text-sm text-brand-600 dark:text-brand-400 hover:underline"
          >
            <CornerDownRight className="w-3.5 h-3.5 shrink-0" />
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}