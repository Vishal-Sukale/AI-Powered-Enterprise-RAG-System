import { FileText, Moon, Sun, Download, LogOut, Shield } from 'lucide-react'

export default function Navbar({ darkMode, onToggleDarkMode, onExportChat, user, onLogout, onOpenAdmin }) {
  return (
    <header className="h-16 border-b border-gray-200/70 dark:border-gray-800/70 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md flex items-center justify-between px-6 shadow-sm sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <div className="bg-brand-600 p-2 rounded-lg">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          RAG Document Assistant
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {user?.role === 'admin' && (
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700 rounded-lg px-3 py-1.5 transition"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </button>
        )}

        <button
          onClick={onExportChat}
          className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700 rounded-lg px-3 py-1.5 transition"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </button>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        <button
          onClick={onToggleDarkMode}
          aria-label="Toggle dark mode"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700 ml-1">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-200 leading-tight">{user.username}</p>
              <p className="text-[10px] text-gray-400 capitalize leading-tight">{user.role}</p>
            </div>
            <button
              onClick={onLogout}
              title="Log out"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <LogOut className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}