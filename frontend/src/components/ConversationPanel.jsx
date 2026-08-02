import { useState, useEffect } from 'react'
import { Plus, Search, MessageSquare, Trash2 } from 'lucide-react'
import { getConversations, deleteConversation } from '../services/api.js'

function groupByRecency(conversations) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - 7)

  const groups = { Today: [], Yesterday: [], 'Previous 7 Days': [], Older: [] }

  for (const conv of conversations) {
    const updated = new Date(conv.updated_at)
    if (updated >= startOfToday) groups['Today'].push(conv)
    else if (updated >= startOfYesterday) groups['Yesterday'].push(conv)
    else if (updated >= startOfWeek) groups['Previous 7 Days'].push(conv)
    else groups['Older'].push(conv)
  }

  return groups
}

export default function ConversationPanel({ activeConversationId, onSelectConversation, onNewChat, refreshKey }) {
  const [conversations, setConversations] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const loadConversations = () => {
    setLoading(true)
    getConversations()
      .then((data) => setConversations(data.conversations || []))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadConversations()
  }, [refreshKey])

  const handleDelete = async (e, conversationId) => {
    e.stopPropagation()
    try {
      await deleteConversation(conversationId)
      setConversations((prev) => prev.filter((c) => c.id !== conversationId))
      if (conversationId === activeConversationId) {
        onNewChat()
      }
    } catch {}
  }

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )
  const grouped = groupByRecency(filtered)

  return (
    <aside className="w-72 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-full flex flex-col p-4">
      <button
        onClick={onNewChat}
        className="flex items-center justify-center gap-2 text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-2 mb-3 transition"
      >
        <Plus className="w-4 h-4" />
        New Chat
      </button>

      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations..."
          className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {loading && <p className="text-xs text-gray-400 text-center py-4">Loading...</p>}

        {!loading && filtered.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">
            {search ? 'No matching conversations.' : 'No conversations yet.'}
          </p>
        )}

        {!loading && Object.entries(grouped).map(([label, items]) =>
          items.length > 0 ? (
            <div key={label}>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-1.5 px-1">
                {label}
              </p>
              <div className="space-y-1">
                {items.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-sm transition
                      ${conv.id === activeConversationId
                        ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    <span className="flex-1 truncate">{conv.title}</span>
                    <button
                      onClick={(e) => handleDelete(e, conv.id)}
                      className="opacity-0 group-hover:opacity-100 transition p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null
        )}
      </div>
    </aside>
  )
}