import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { login, signup } from '../services/api.js'

export default function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('employee')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        await signup(username, password, role)
        setMode('login')
        setError('Account created — please log in.')
      } else {
        await login(username, password)
        onLoginSuccess()
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-8">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="bg-brand-600 p-2 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            RAG Document Assistant
          </h1>
        </div>

        <div className="flex mb-6 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
          <button
            onClick={() => { setMode('login'); setError('') }}
            className={`flex-1 text-sm py-1.5 rounded-md transition ${mode === 'login' ? 'bg-white dark:bg-gray-700 shadow-sm font-medium' : 'text-gray-500'}`}
          >
            Log In
          </button>
          <button
            onClick={() => { setMode('signup'); setError('') }}
            className={`flex-1 text-sm py-1.5 rounded-md transition ${mode === 'signup' ? 'bg-white dark:bg-gray-700 shadow-sm font-medium' : 'text-gray-500'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full mt-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="employee">Employee</option>
                <option value="guest">Guest</option>
                <option value="admin">Admin (demo only)</option>
              </select>
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-5">
          First time here? Default admin: <span className="font-mono">admin / admin123</span>
        </p>
      </div>
    </div>
  )
}