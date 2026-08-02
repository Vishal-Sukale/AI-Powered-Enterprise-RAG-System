let listeners = []
let toasts = []
let idCounter = 0

function notifyListeners() {
  listeners.forEach((listener) => listener([...toasts]))
}

export function subscribe(listener) {
  listeners.push(listener)
  listener([...toasts])
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function push(type, message, duration = 3500) {
  const id = ++idCounter
  toasts = [...toasts, { id, type, message }]
  notifyListeners()

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    notifyListeners()
  }, duration)
}

export const toast = {
  success: (message) => push('success', message),
  error: (message) => push('error', message),
  info: (message) => push('info', message),
}