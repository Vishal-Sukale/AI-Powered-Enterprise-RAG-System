import { useState, useEffect } from 'react'
import {
  Sparkles, Plus, MessageSquare, FolderOpen, BarChart3, Shield,
  Settings, Sun, Moon, LogOut, Search, Trash2,
} from 'lucide-react'
import { getConversations, deleteConversation } from '../services/api.js'

const NAV_ITEMS = [
  { key: 'documents', label: 'Uploaded Documents', icon: FolderOpen },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
]

export default function LeftNav({
  view, onChangeView, activeConversationId, onSelectConversation, onNewChat,
  darkMode, onToggleDarkMode, user, onLogout, refreshKey,
}) {
  const [conversations, setConversations] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    getConversations()
      .then((data) => setConversations(data.conversations || []))
      .catch(() => setConversations([]))
  }, [refreshKey])

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    try {
      await deleteConversation(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (id === activeConversationId) onNewChat()
    } catch {}
  }

  const filteredConvos = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <aside className="w-64 h-screen shrink-0 flex flex-col bg-[#0B0F19] border-r border-white/[0.08]">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-white/[0.08]">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-secondary-500 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-white font-semibold text-sm">Enterprise RAG</span>
      </div>

      <div className="p-3">
        <button
          onClick={() => { onNewChat(); onChangeView('chat') }}
          className="w-full flex items-center justify-center gap-2 text-sm font-medium bg-gradient-to-r from-brand-500 to-secondary-500 hover:opacity-90 text-white rounded-xl py-2.5 transition shadow-glow"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      <div className="px-3 space-y-1">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onChangeView(key)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition
              ${view === key ? 'bg-white/[0.06] text-white' : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
        {user?.role === 'admin' && (
          <button
            onClick={() => onChangeView('admin')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition
              ${view === 'admin' ? 'bg-white/[0.06] text-white' : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'}`}
          >
            <Shield className="w-4 h-4" />
            Admin Panel
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 mt-4 min-h-0">
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 text-gray-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-8 pr-2 py-1.5 text-xs bg-white/[0.04] border border-white/[0.06] rounded-lg text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
          />
        </div>

        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide px-1 mb-1.5">Recent Chats</p>

        {filteredConvos.length === 0 && (
          <p className="text-xs text-gray-600 px-1 py-2">No conversations yet.</p>
        )}

        <div className="space-y-0.5 pb-2">
          {filteredConvos.map((conv) => (
            <div
              key={conv.id}
              onClick={() => { onSelectConversation(conv.id); onChangeView('chat') }}
              className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-xs transition
                ${conv.id === activeConversationId && view === 'chat'
                  ? 'bg-white/[0.08] text-white'
                  : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'}`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
              <span className="flex-1 truncate">{conv.title}</span>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 transition p-0.5 rounded hover:bg-red-500/20"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/[0.08] p-3 space-y-2">
        <button
          onClick={onToggleDarkMode}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/[0.04] hover:text-gray-200 transition"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>

        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-white/[0.03]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary-500 to-accent-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {user?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-200 truncate">{user?.username}</p>
            <p className="text-[10px] text-gray-500 capitalize">{user?.role}</p>
          </div>
          <button onClick={onLogout} title="Log out" className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-gray-300">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}