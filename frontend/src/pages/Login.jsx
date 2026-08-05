import { useState } from 'react'
import { Sparkles, FileStack, BrainCircuit, SearchCheck, ShieldCheck, Zap, Eye, EyeOff } from 'lucide-react'
import { login, signup } from '../services/api.js'
import { toast } from '../services/toast.js'

const FEATURES = [
  { icon: FileStack, text: 'Multi-format Document Upload', color: 'text-brand-400 bg-brand-500/10' },
  { icon: BrainCircuit, text: 'AI-powered Enterprise Search', color: 'text-secondary-400 bg-secondary-500/10' },
  { icon: SearchCheck, text: 'Hybrid Semantic Retrieval', color: 'text-accent-400 bg-accent-500/10' },
  { icon: ShieldCheck, text: 'Secure Role-Based Authentication', color: 'text-secondary-400 bg-secondary-500/10' },
  { icon: Zap, text: 'Lightning-fast AI Responses', color: 'text-brand-400 bg-brand-500/10' },
]

export default function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="h-screen flex bg-[#0B0F19] font-sans overflow-hidden">
      {/* LEFT: hero */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-14 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-secondary-500/20 rounded-full blur-3xl animate-float-slower" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl animate-float-slow" />

        <div className="relative z-10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-secondary-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold tracking-wide">Enterprise RAG</span>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            What knowledge will<br />you unlock today?
          </h1>
          <p className="text-gray-400 text-lg mb-10">Enterprise AI Document Intelligence Platform</p>

          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text, color }) => (
              <div
                key={text}
                className="flex items-center gap-3 glass-card rounded-xl px-4 py-3 transition hover:border-white/20 hover:-translate-y-0.5 duration-200"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-sm text-gray-200 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-gray-600">Powered by Enterprise RAG System</div>
      </div>

      {/* RIGHT: auth card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 relative">
        <div className="absolute inset-0 lg:hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-secondary-500/10 rounded-full blur-3xl animate-float-slower" />
        </div>

        <div className="relative z-10 w-full max-w-sm glass-card rounded-2xl shadow-glass p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-secondary-500 flex items-center justify-center mb-3 shadow-glow">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">Enterprise RAG</h2>
            <p className="text-gray-500 text-sm mt-0.5">Secure AI Workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-400">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full mt-1 bg-white/5 border border-white/10 text-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-white/5 border border-white/10 text-gray-100 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="text-xs font-medium text-gray-400">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full mt-1 bg-white/5 border border-white/10 text-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                >
                  <option value="employee">Employee</option>
                  <option value="guest">Guest</option>
                </select>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-brand-500 focus:ring-brand-500/50"
                  />
                  Remember me
                </label>
                <button type="button" onClick={() => toast.info('Password reset flow not implemented yet.')} className="text-brand-400 hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            {error && <p className="text-xs text-brand-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-500 to-secondary-500 hover:opacity-90 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition shadow-glow"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-600">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            className="w-full border border-white/10 hover:border-white/20 text-gray-300 rounded-xl py-2.5 text-sm font-medium transition"
          >
            {mode === 'login' ? 'Sign up' : 'Back to login'}
          </button>

          <p className="text-xs text-gray-600 text-center mt-6">
            Default Admin: <span className="font-mono text-gray-400">admin / admin123</span>
          </p>
        </div>
      </div>
    </div>
  )
}