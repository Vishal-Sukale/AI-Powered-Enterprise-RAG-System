import { useState, useEffect } from 'react'
import { RefreshCw, Trash2, Download, FileText, ArrowLeft } from 'lucide-react'
import {
  adminListDocuments, adminRebuildIndex, adminGetLogs,
  adminGetFeedbackStats, adminClearCache,
} from '../services/api.js'

export default function Admin({ onBack }) {
  const [documents, setDocuments] = useState([])
  const [logs, setLogs] = useState([])
  const [feedbackStats, setFeedbackStats] = useState(null)
  const [rebuilding, setRebuilding] = useState(false)
  const [message, setMessage] = useState('')

  const loadAll = async () => {
    try {
      const [docsRes, logsRes, statsRes] = await Promise.all([
        adminListDocuments(),
        adminGetLogs(100),
        adminGetFeedbackStats(),
      ])
      setDocuments(docsRes.documents || [])
      setLogs(logsRes.logs || [])
      setFeedbackStats(statsRes)
    } catch (err) {
      console.error('Failed to load admin data', err)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const handleRebuild = async () => {
    setRebuilding(true)
    setMessage('')
    try {
      const result = await adminRebuildIndex()
      setMessage(`Rebuilt: ${result.rebuilt.length} · Failed: ${result.failed.length}`)
      await loadAll()
    } catch (err) {
      setMessage('Rebuild failed. Check logs.')
    } finally {
      setRebuilding(false)
    }
  }

  const handleClearCache = async () => {
    await adminClearCache()
    setMessage('In-memory cache cleared.')
  }

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Admin Panel</h1>
          </div>
          <button
            onClick={loadAll}
            className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {message && (
          <div className="text-sm bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-800 rounded-lg px-4 py-2">
            {message}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Documents" value={documents.length} />
          <StatCard
            label="Total Chunks"
            value={documents.reduce((sum, d) => sum + (d.chunks_indexed || 0), 0)}
          />
          <StatCard
            label="Feedback (👍)"
            value={feedbackStats ? `${feedbackStats.helpful}/${feedbackStats.total_feedback}` : '—'}
          />
          <StatCard
            label="Helpful Rate"
            value={feedbackStats ? `${feedbackStats.helpful_rate}%` : '—'}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRebuild}
            disabled={rebuilding}
            className="flex items-center gap-2 text-sm bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg px-4 py-2"
          >
            <RefreshCw className={`w-4 h-4 ${rebuilding ? 'animate-spin' : ''}`} />
            Rebuild Index
          </button>
          <button
            onClick={handleClearCache}
            className="flex items-center gap-2 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cache
          </button>
          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/admin/logs/download`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Download className="w-4 h-4" />
            Download Logs
          </a>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 font-medium text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Indexed Documents
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto">
            {documents.length === 0 && (
              <p className="p-4 text-sm text-gray-400">No documents indexed yet.</p>
            )}
            {documents.map((doc, idx) => (
              <div key={idx} className="px-4 py-2.5 flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-200 truncate">{doc.filename}</span>
                <span className="text-gray-400 dark:text-gray-500 text-xs">{doc.chunks_indexed} chunks</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 font-medium text-sm text-gray-700 dark:text-gray-200">
            Recent Logs
          </div>
          <div className="p-4 max-h-64 overflow-y-auto bg-gray-900 dark:bg-black">
            {logs.length === 0 && <p className="text-xs text-gray-500">No logs yet.</p>}
            {logs.map((line, idx) => (
              <p key={idx} className="text-xs font-mono text-green-400 leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-gray-800 dark:text-gray-100 mt-1">{value}</p>
    </div>
  )
}