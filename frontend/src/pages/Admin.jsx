import { useState, useEffect } from 'react'
import { RefreshCw, Trash2, Download, FileText, ArrowLeft, Shield } from 'lucide-react'
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
    <div className="h-screen overflow-y-auto bg-[#0B0F19] p-6 relative">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-brand-500/10 rounded-full blur-3xl animate-float-slower pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/[0.06] transition">
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-secondary-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-white">Admin Panel</h1>
          </div>
          <button
            onClick={loadAll}
            className="flex items-center gap-1.5 text-sm text-gray-300 border border-white/[0.08] bg-white/[0.03] rounded-lg px-3 py-1.5 hover:bg-white/[0.06] transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {message && (
          <div className="text-sm bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-lg px-4 py-2 backdrop-blur-xs">
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
            className="flex items-center gap-2 text-sm bg-gradient-to-r from-brand-500 to-secondary-500 hover:opacity-90 disabled:opacity-50 text-white rounded-lg px-4 py-2 shadow-glow transition"
          >
            <RefreshCw className={`w-4 h-4 ${rebuilding ? 'animate-spin' : ''}`} />
            Rebuild Index
          </button>
          <button
            onClick={handleClearCache}
            className="flex items-center gap-2 text-sm border border-white/[0.08] bg-white/[0.03] text-gray-300 rounded-lg px-4 py-2 hover:bg-white/[0.06] transition"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cache
          </button>
          
          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/admin/logs/download`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm border border-white/[0.08] bg-white/[0.03] text-gray-300 rounded-lg px-4 py-2 hover:bg-white/[0.06] transition"
          >
            <Download className="w-4 h-4" />
            Download Logs
          </a>
        </div>

        <div className="glass-card rounded-xl overflow-hidden shadow-glass">
          <div className="px-4 py-3 border-b border-white/[0.08] font-medium text-sm text-gray-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-secondary-400" /> Indexed Documents
          </div>
          <div className="divide-y divide-white/[0.06] max-h-64 overflow-y-auto">
            {documents.length === 0 && (
              <p className="p-4 text-sm text-gray-500">No documents indexed yet.</p>
            )}
            {documents.map((doc, idx) => (
              <div key={idx} className="px-4 py-2.5 flex items-center justify-between text-sm">
                <span className="text-gray-200 truncate">{doc.filename}</span>
                <span className="text-gray-500 text-xs">{doc.chunks_indexed} chunks</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl overflow-hidden shadow-glass">
          <div className="px-4 py-3 border-b border-white/[0.08] font-medium text-sm text-gray-200">
            Recent Logs
          </div>
          <div className="p-4 max-h-64 overflow-y-auto bg-black/40">
            {logs.length === 0 && <p className="text-xs text-gray-500">No logs yet.</p>}
            {logs.map((line, idx) => (
              <p key={idx} className="text-xs font-mono text-accent-400 leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="glass-card rounded-xl p-4 shadow-glass">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-white mt-1">{value}</p>
    </div>
  )
}