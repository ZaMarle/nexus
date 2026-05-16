import { useState } from 'react'
import './App.css'

interface AuthUser { id: string; name: string; email: string }

function App() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login' ? { email, password } : { name, email, password }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.status === 401) { setError('Invalid email or password.'); return }
      if (res.status === 409) { setError('An account with that email already exists.'); return }
      if (!res.ok) { setError('Something went wrong. Please try again.'); return }

      const data = await res.json()
      localStorage.setItem('token', data.token)
      setUser(data.user)
    } catch {
      setError('Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }

  function handleSignOut() {
    localStorage.removeItem('token')
    setUser(null)
    setName(''); setEmail(''); setPassword('')
  }

  if (user) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Nexus</h1>
            <p>Signed in as <strong>{user.email}</strong></p>
          </div>
          <div className="welcome">
            <span className="avatar">{user.name[0].toUpperCase()}</span>
            <p className="welcome-name">{user.name}</p>
          </div>
          <button className="submit-btn" onClick={handleSignOut}>Sign out</button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Nexus</h1>
          <p>{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                placeholder="Jane Smith"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </div>

          {mode === 'login' && (
            <a href="#" className="forgot-link">Forgot password?</a>
          )}

          {error && <p className="error">{error}</p>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <button className="switch-btn" onClick={() => { setMode('signup'); setError('') }}>Sign up</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button className="switch-btn" onClick={() => { setMode('login'); setError('') }}>Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
