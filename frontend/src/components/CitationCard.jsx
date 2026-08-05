import { FileText } from 'lucide-react'

function renderWithHighlight(content, highlight) {
  if (!highlight) return content

  const index = content.indexOf(highlight)
  if (index === -1) return content

  const before = content.slice(0, index)
  const after = content.slice(index + highlight.length)

  return (
    <>
      {before}
      <mark className="bg-brand-500/30 text-inherit rounded px-0.5">
        {highlight}
      </mark>
      {after}
    </>
  )
}

export default function CitationCard({ source }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-lg p-3 text-sm backdrop-blur-xs">
      <div className="flex items-center justify-between mb-1 gap-2">
        <div className="flex items-center gap-1 text-gray-300 font-medium min-w-0">
          <FileText className="w-3.5 h-3.5 shrink-0 text-secondary-400" />
          <span className="truncate">{source.filename}</span>
        </div>
        <span className="text-xs text-gray-500 shrink-0 whitespace-nowrap">
          Page {source.page}
          {source.chunk_index ? ` · Chunk ${source.chunk_index}` : ''}
        </span>
      </div>

      <p className="text-gray-400 text-xs leading-relaxed">
        {renderWithHighlight(source.content, source.highlight)}
      </p>

      <p className="text-xs text-brand-400 mt-1 font-medium">
        Similarity: {source.similarity}%
      </p>
    </div>
  )
}