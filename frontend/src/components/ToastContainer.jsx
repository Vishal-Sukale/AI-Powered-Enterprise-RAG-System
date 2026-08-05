import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Info } from 'lucide-react'
import { subscribe } from '../services/toast.js'

const ICONS = {
  success: <CheckCircle2 className="w-4 h-4 text-accent-400" />,
  error: <XCircle className="w-4 h-4 text-red-400" />,
  info: <Info className="w-4 h-4 text-secondary-400" />,
}

const STYLES = {
  success: 'border-accent-500/20 bg-[#111827]/95 backdrop-blur-xs',
  error: 'border-red-500/20 bg-[#111827]/95 backdrop-blur-xs',
  info: 'border-secondary-500/20 bg-[#111827]/95 backdrop-blur-xs',
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
          className={`pointer-events-auto flex items-start gap-2 border rounded-xl shadow-glass px-4 py-3 text-sm text-gray-200 animate-[slideIn_0.2s_ease-out] ${STYLES[t.type]}`}
        >
          {ICONS[t.type]}
          <span className="flex-1 leading-snug">{t.message}</span>
        </div>
      ))}
    </div>
  )
}