import { RotateCcw, FileCheck2, X } from 'lucide-react'

function DocumentSkeleton() {
  return (
    <div className="animate-pulse flex items-center gap-2 p-2 rounded-lg bg-white/[0.03]">
      <div className="w-4 h-4 rounded-full bg-white/[0.08] shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-white/[0.08] rounded w-3/4" />
        <div className="h-2 bg-white/[0.08] rounded w-1/3" />
      </div>
    </div>
  )
}

export default function Sidebar({ uploadedFiles, loading, onReset, onDeleteDocument }) {
  return (
    <aside className="w-72 h-full flex flex-col p-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Indexed Documents
      </h2>

      <div className="flex-1 overflow-y-auto space-y-2">
        {loading ? (
          <>
            <DocumentSkeleton />
            <DocumentSkeleton />
            <DocumentSkeleton />
          </>
        ) : uploadedFiles.length === 0 ? (
          <p className="text-sm text-gray-500">No documents uploaded yet.</p>
        ) : (
          uploadedFiles.map((file, idx) => (
            <div
              key={idx}
              className="group flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] transition hover:bg-white/[0.06]"
            >
              <FileCheck2 className="w-4 h-4 text-accent-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-200 truncate">
                  {file.filename}
                </p>
                <p className="text-xs text-gray-500">
                  {file.chunks_indexed} chunks
                </p>
              </div>
              <button
                onClick={() => onDeleteDocument(file.filename)}
                className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-red-500/20"
                title={`Remove ${file.filename}`}
              >
                <X className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          ))
        )}
      </div>

      <button
        onClick={onReset}
        className="mt-4 flex items-center justify-center gap-2 text-sm text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 rounded-lg py-2 transition"
      >
        <RotateCcw className="w-4 h-4" />
        Reset Knowledge Base
      </button>
    </aside>
  )
}