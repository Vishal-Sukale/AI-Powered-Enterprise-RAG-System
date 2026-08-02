import { useState, useEffect } from 'react'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Admin from './pages/Admin.jsx'
import ToastContainer from './components/ToastContainer.jsx'
import { getCurrentUser, clearAuthSession } from './services/api.js'

function App() {
  const [user, setUser] = useState(getCurrentUser())
  const [view, setView] = useState('home')

  useEffect(() => {
    setView('home')
  }, [user])

  const handleLogout = () => {
    clearAuthSession()
    setUser(null)
  }

  return (
    <>
      <ToastContainer />
      {!user ? (
        <Login onLoginSuccess={() => setUser(getCurrentUser())} />
      ) : view === 'admin' && user.role === 'admin' ? (
        <Admin onBack={() => setView('home')} />
      ) : (
        <Home user={user} onLogout={handleLogout} onOpenAdmin={() => setView('admin')} />
      )}
    </>
  )
}

export default App