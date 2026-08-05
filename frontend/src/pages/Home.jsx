import { useState, useEffect, useRef } from 'react'
import LeftNav from '../components/LeftNav.jsx'
import Sidebar from '../components/Sidebar.jsx'
import UploadBox from '../components/UploadBox.jsx'
import ChatBox from '../components/ChatBox.jsx'
import { resetIndex, listDocuments, deleteDocument, getStats } from '../services/api.js'
import { toast } from '../services/toast.js'
import { FileStack, MessageSquare, Percent, Layers, ArrowLeft } from 'lucide-react'

export default function Home({ user, onLogout, onOpenAdmin }) {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [conversationListRefreshKey, setConversationListRefreshKey] = useState(0)
  const [view, setView] = useState('chat') // 'chat' | 'documents' | 'analytics' | 'admin'
  const [stats, setStats] = useState(null)
  const [darkMode, setDarkMode] = useState(true)
  const chatBoxRef = useRef(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    setLoadingDocs(true)
    listDocuments()
      .then((data) => setUploadedFiles(data.documents || []))
      .catch(() => setUploadedFiles([]))
      .finally(() => setLoadingDocs(false))
  }, [])

  useEffect(() => {
    if (view === 'analytics') {
      getStats().then(setStats).catch(() => setStats(null))
    }
  }, [view])

  const handleUploadSuccess = (data) => {
    setUploadedFiles((prev) => [...prev, data])
    toast.success(`"${data.filename}" indexed — ${data.chunks_indexed} chunks ready.`)
  }

  const handleReset = async () => {
    try {
      await resetIndex()
      setUploadedFiles([])
      toast.info('Knowledge base reset.')
    } catch (err) {
      toast.error('Failed to reset the knowledge base.')
    }
  }

  const handleDeleteDocument = async (filename) => {
    try {
      await deleteDocument(filename)
      setUploadedFiles((prev) => prev.filter((f) => f.filename !== filename))
      toast.success(`Removed "${filename}".`)
    } catch (err) {
      toast.error(`Failed to remove "${filename}".`)
    }
  }

  const handleNewChat = () => setActiveConversationId(null)
  const handleSelectConversation = (id) => setActiveConversationId(id)
  const handleConversationCreated = (newId) => {
    setActiveConversationId(newId)
    setConversationListRefreshKey((k) => k + 1)
  }

  return (
    <div className="h-screen flex bg-[#0B0F19]">
      <LeftNav
        view={view}
        onChangeView={(v) => { if (v === 'admin') onOpenAdmin(); else setView(v) }}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        user={user}
        onLogout={onLogout}
        refreshKey={conversationListRefreshKey}
      />

      <main className="flex-1 min-w-0">
        {view === 'chat' && (
          <ChatBox
            ref={chatBoxRef}
            hasDocuments={uploadedFiles.length > 0}
            uploadedFiles={uploadedFiles}
            conversationId={activeConversationId}
            onConversationCreated={handleConversationCreated}
            onGoToDocuments={() => setView('documents')}
            onResetDocuments={handleReset}
            onNewChat={handleNewChat}
          />
        )}

        {view === 'documents' && (
          <div className="h-full overflow-y-auto p-8 bg-[#0B0F19]">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { handleNewChat(); setView('chat') }}
                  className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-400 hover:text-white transition"
                  title="Back to New Chat"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-white">Uploaded Documents</h1>
                  <p className="text-sm text-gray-500 mt-1">Manage your knowledge base.</p>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-5">
                <UploadBox onUploadSuccess={handleUploadSuccess} />
              </div>
              <div className="glass-card rounded-2xl overflow-hidden">
                <Sidebar
                  uploadedFiles={uploadedFiles}
                  loading={loadingDocs}
                  onReset={handleReset}
                  onDeleteDocument={handleDeleteDocument}
                />
              </div>
            </div>
          </div>
        )}

        {view === 'analytics' && (
          <div className="h-full overflow-y-auto p-8 bg-[#0B0F19]">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { handleNewChat(); setView('chat') }}
                  className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-400 hover:text-white transition"
                  title="Back to New Chat"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-white">Analytics</h1>
                  <p className="text-sm text-gray-500 mt-1">Your usage across this workspace.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={FileStack} label="Documents" value={stats?.total_documents ?? '—'} gradient="from-secondary-500 to-secondary-700" />
                <StatCard icon={Layers} label="Total Chunks" value={stats?.total_chunks ?? '—'} gradient="from-accent-500 to-accent-700" />
                <StatCard icon={MessageSquare} label="Your Queries" value={stats?.total_queries ?? '—'} gradient="from-brand-500 to-brand-700" />
                <StatCard icon={Percent} label="Avg Confidence" value={stats ? `${stats.avg_confidence}%` : '—'} gradient="from-secondary-500 to-brand-500" />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className={`rounded-2xl p-5 bg-gradient-to-br ${gradient} shadow-glass`}>
      <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center mb-4">
        <Icon className="w-4.5 h-4.5 text-white" />
      </div>
      <p className="text-xs text-white/80">{label}</p>
      <p className="text-2xl font-semibold text-white mt-1">{value}</p>
    </div>
  )
}