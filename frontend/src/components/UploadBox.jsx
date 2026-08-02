import { useRef, useState } from 'react'
import { UploadCloud, Loader2 } from 'lucide-react'
import { uploadPDF, pollJobUntilComplete } from '../services/api.js'
import { toast } from '../services/toast.js'

const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md', '.csv', '.xlsx', '.pptx', '.json', '.html', '.htm']
const ACCEPT_ATTR = SUPPORTED_EXTENSIONS.join(',')
const FORMAT_BADGES = ['PDF', 'DOCX', 'TXT', 'CSV', 'XLSX', 'PPTX', 'JSON', 'HTML']

export default function UploadBox({ onUploadSuccess }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState('')
  const [statusText, setStatusText] = useState('')
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const isSupported = (name) =>
    SUPPORTED_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext))

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || [])
    if (files.length === 0) return

    const validFiles = files.filter((f) => isSupported(f.name))
    if (validFiles.length === 0) {
      setError(`Unsupported file type. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`)
      return
    }

    setError('')
    setUploading(true)

    for (const file of validFiles) {
      setCurrentFile(file.name)
      setProgress(0)
      setStatusText('Uploading')

      try {
        const uploadResult = await uploadPDF(file, setProgress)
        setStatusText('Processing & indexing')
        const job = await pollJobUntilComplete(uploadResult.job_id)

        if (job.status === 'failed') {
          setError(`Failed to process "${file.name}": ${job.error || 'Unknown error'}`)
          continue
        }

        onUploadSuccess({ filename: job.filename, chunks_indexed: job.chunks_indexed })
      } catch (err) {
        setError(`Failed to process "${file.name}": ${err.message || 'Unknown error'}`)
      }
    }

    setUploading(false)
    setProgress(0)
    setCurrentFile('')
    setStatusText('')
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragActive(false)
        handleFiles(e.dataTransfer.files)
      }}
      onClick={() => inputRef.current?.click()}
      className={`group cursor-pointer border-2 border-dashed rounded-2xl px-5 py-7 text-center transition-all duration-200
        ${dragActive
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 scale-[1.02] shadow-md'
          : 'border-gray-400 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-brand-400 hover:bg-brand-50/40 dark:hover:bg-brand-950/20 hover:shadow-sm'}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {uploading ? (
        <div className="flex flex-col items-center gap-3 py-2">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[220px]">
              {currentFile}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {statusText}{progress > 0 && progress < 100 ? ` — ${progress}%` : '...'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 group-hover:-translate-y-0.5">
            <UploadCloud className="w-7 h-7 text-brand-600" strokeWidth={1.75} />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Drop files here
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              or click to browse
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-1.5 mt-1 max-w-[200px]">
            {FORMAT_BADGES.map((badge) => (
              <span
                key={badge}
                className="text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-3 leading-snug">{error}</p>
      )}
    </div>
  )
}