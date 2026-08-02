import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar.jsx'
import Sidebar from '../components/Sidebar.jsx'
import UploadBox from '../components/UploadBox.jsx'
import ChatBox from '../components/ChatBox.jsx'
import ConversationPanel from '../components/ConversationPanel.jsx'
import { resetIndex, listDocuments, deleteDocument } from '../services/api.js'
import { toast } from '../services/toast.js'

const DARK_MODE_KEY = 'rag_dark_mode_v1'

export default function Home({ user, onLogout, onOpenAdmin }) {
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [conversationListRefreshKey, setConversationListRefreshKey] = useState(0)
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem(DARK_MODE_KEY) === 'true'
    } catch {
      return false
    }
  })
  const chatBoxRef = useRef(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    try {
      localStorage.setItem(DARK_MODE_KEY, String(darkMode))
    } catch {}
  }, [darkMode])

  useEffect(() => {
    setLoadingDocs(true)
    listDocuments()
      .then((data) => setUploadedFiles(data.documents || []))
      .catch(() => setUploadedFiles([]))
      .finally(() => setLoadingDocs(false))
  }, [])

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

  const handleNewChat = () => {
    setActiveConversationId(null)
  }

  const handleSelectConversation = (conversationId) => {
    setActiveConversationId(conversationId)
  }

  const handleConversationCreated = (newConversationId) => {
    setActiveConversationId(newConversationId)
    setConversationListRefreshKey((k) => k + 1)
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        onExportChat={() => chatBoxRef.current?.exportChat()}
        user={user}
        onLogout={onLogout}
        onOpenAdmin={onOpenAdmin}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col">
          <Sidebar
            uploadedFiles={uploadedFiles}
            loading={loadingDocs}
            onReset={handleReset}
            onDeleteDocument={handleDeleteDocument}
          />
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <UploadBox onUploadSuccess={handleUploadSuccess} />
          </div>
        </div>

        <main className="flex-1 bg-gray-50 dark:bg-gray-950">
          <ChatBox
            ref={chatBoxRef}
            hasDocuments={uploadedFiles.length > 0}
            uploadedFiles={uploadedFiles}
            conversationId={activeConversationId}
            onConversationCreated={handleConversationCreated}
          />
        </main>

        <ConversationPanel
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          refreshKey={conversationListRefreshKey}
        />
      </div>
    </div>
  )
}