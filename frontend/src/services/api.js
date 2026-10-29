import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL
  ?? (import.meta.env.PROD ? '' : 'http://localhost:8000')
const AUTH_TOKEN_KEY = 'rag_auth_token_v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthSession({ access_token, username, role }) {
  localStorage.setItem(AUTH_TOKEN_KEY, access_token)
  localStorage.setItem('rag_username', username)
  localStorage.setItem('rag_role', role)
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem('rag_username')
  localStorage.removeItem('rag_role')
}

export function getCurrentUser() {
  const token = getAuthToken()
  if (!token) return null
  return {
    username: localStorage.getItem('rag_username'),
    role: localStorage.getItem('rag_role'),
  }
}

export async function login(username, password) {
  const response = await api.post('/auth/login', { username, password })
  setAuthSession(response.data)
  return response.data
}

export async function signup(username, password, role = 'employee') {
  const response = await api.post('/auth/signup', { username, password, role })
  return response.data
}

export async function uploadPDF(file, onProgress) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress) {
        const percent = Math.round((event.loaded * 100) / event.total)
        onProgress(percent)
      }
    },
  })
  return response.data
}

export async function sendChatMessage(query, history = [], documentFilter = null, conversationId = null) {
  const response = await api.post('/chat', {
    query, history, document_filter: documentFilter, conversation_id: conversationId,
  })
  return response.data
}

export async function streamChatMessage(query, history = [], documentFilter, conversationId, onConversation, onToken, onDone, onError) {
  try {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        query, history, document_filter: documentFilter, conversation_id: conversationId,
      }),
    })

    if (!response.ok || !response.body) {
      throw new Error(`Stream request failed: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      buffer = lines.pop()

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const jsonStr = line.slice(6)
        const event = JSON.parse(jsonStr)

        if (event.type === 'conversation') {
          onConversation(event.conversation_id)
        } else if (event.type === 'token') {
          onToken(event.content)
        } else if (event.type === 'done') {
          onDone(event.sources || [], event.confidence || 0, event.history_id || null, event.related_questions || [])
        } else if (event.type === 'error') {
          onError(event.message)
        }
      }
    }
  } catch (err) {
    onError(err.message || 'Streaming failed')
  }
}

export async function getConversations() {
  const response = await api.get('/conversations')
  return response.data
}

export async function getConversationMessages(conversationId) {
  const response = await api.get(`/conversations/${conversationId}/messages`)
  return response.data
}

export async function deleteConversation(conversationId) {
  const response = await api.delete(`/conversations/${conversationId}`)
  return response.data
}

export async function getJobStatus(jobId) {
  const response = await api.get(`/jobs/${jobId}`)
  return response.data
}

export async function pollJobUntilComplete(jobId, { intervalMs = 1000, timeoutMs = 120000 } = {}) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const job = await getJobStatus(jobId)
    if (job.status === 'done' || job.status === 'failed') {
      return job
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  throw new Error('Processing timed out. The file may be very large — check back later.')
}

export async function getSuggestedQuestions(filename) {
  const response = await api.get(`/documents/${encodeURIComponent(filename)}/suggested-questions`)
  return response.data
}

export async function listDocuments() {
  const response = await api.get('/documents')
  return response.data
}

export async function deleteDocument(filename) {
  const response = await api.delete(`/documents/${encodeURIComponent(filename)}`)
  return response.data
}

export async function resetIndex() {
  const response = await api.delete('/reset')
  return response.data
}

export async function sendFeedback(historyId, helpful) {
  const response = await api.post('/feedback', { history_id: historyId, helpful })
  return response.data
}

export async function getMyHistory(limit = 100) {
  const response = await api.get(`/history?limit=${limit}`)
  return response.data
}

export async function getStats() {
  const response = await api.get('/stats')
  return response.data
}

// --- Admin-only endpoints ---
export async function adminListDocuments() {
  const response = await api.get('/admin/documents')
  return response.data
}

export async function adminRebuildIndex() {
  const response = await api.post('/admin/rebuild-index')
  return response.data
}

export async function adminGetLogs(lines = 200) {
  const response = await api.get(`/admin/logs?lines=${lines}`)
  return response.data
}

export async function adminGetFeedbackStats() {
  const response = await api.get('/admin/feedback-stats')
  return response.data
}

export async function adminGetQueryHistory(limit = 100) {
  const response = await api.get(`/admin/query-history?limit=${limit}`)
  return response.data
}

export async function adminClearCache() {
  const response = await api.delete('/admin/cache')
  return response.data
}

export async function checkHealth() {
  const response = await api.get('/health')
  return response.data
}

export default api