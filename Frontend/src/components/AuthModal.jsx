// Supabase authentication modal component
// Handles user login/signup via Supabase Auth
// src/components/AuthModal.jsx
import { useState } from 'react'
import { supabase } from '../supabaseClient'

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(10, 20, 10, 0.85)',
    backdropFilter: 'blur(6px)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    background: 'var(--canopy)',
    border: '1px solid var(--moss)',
    borderRadius: '6px',
    padding: '36px',
    width: '340px',
    animation: 'fadeUp 0.25s ease',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '20px',
    color: 'var(--parchment)',
    marginBottom: '6px',
  },
  subtitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--sage)',
    marginBottom: '28px',
    letterSpacing: '0.05em',
  },
  label: {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--sage)',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(74,124,89,0.4)',
    borderRadius: '3px',
    color: 'var(--parchment)',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    marginBottom: '16px',
    outline: 'none',
  },
  btn: {
    width: '100%',
    padding: '11px',
    background: 'var(--moss)',
    border: 'none',
    borderRadius: '3px',
    color: 'var(--cream)',
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    marginBottom: '12px',
    transition: 'background 0.2s',
  },
  toggle: {
    background: 'none',
    border: 'none',
    color: 'var(--sage)',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    cursor: 'pointer',
    textDecoration: 'underline',
    display: 'block',
    margin: '0 auto',
  },
  error: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: '#e07070',
    marginBottom: '12px',
  },
  close: {
    position: 'absolute',
    top: '12px', right: '16px',
    background: 'none',
    border: 'none',
    color: 'var(--sage)',
    fontSize: '18px',
    cursor: 'pointer',
  },
}

export default function AuthModal({ onClose, onAuth }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const { data, error: authError } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (authError) {
      setError(authError.message)
    } else {
      onAuth(data.user)
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
        <div style={styles.modal}>
          <button style={styles.close} onClick={onClose}>×</button>
          <h2 style={styles.title}>{isSignUp ? 'Create account' : 'Welcome back'}</h2>
          <p style={styles.subtitle}>
            {isSignUp ? 'Save your queries and history' : 'Sign in to your Sylva account'}
          </p>

          {error && <p style={styles.error}>{error}</p>}

          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />

          <button style={styles.btn} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Please wait...' : (isSignUp ? 'Create account' : 'Sign in')}
          </button>

          <button style={styles.toggle} onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  )
}