import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Info } from 'lucide-react'
import { subscribe } from '../services/toast.js'

const ICONS = {
  success: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  error: <XCircle className="w-4 h-4 text-red-500" />,
  info: <Info className="w-4 h-4 text-blue-500" />,
}

const STYLES = {
  success: 'border-green-200 dark:border-green-900 bg-white dark:bg-gray-900',
  error: 'border-red-200 dark:border-red-900 bg-white dark:bg-gray-900',
  info: 'border-blue-200 dark:border-blue-900 bg-white dark:bg-gray-900',
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    return subscribe(setToasts)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-2 border rounded-xl shadow-lg px-4 py-3 text-sm text-gray-700 dark:text-gray-200 animate-[slideIn_0.2s_ease-out] ${STYLES[t.type]}`}
        >
          {ICONS[t.type]}
          <span className="flex-1 leading-snug">{t.message}</span>
        </div>
      ))}
    </div>
  )
}