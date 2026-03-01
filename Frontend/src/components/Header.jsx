// src/components/Header.jsx
import { useState } from 'react'
import AuthModal from './AuthModal'

const styles = {
  header: {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    height: 'var(--header-height)',
    background: 'rgba(26, 46, 26, 0.95)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(74, 124, 89, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 1000,
  },
  brand: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px',
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--sage)',
    letterSpacing: '0.02em',
  },
  tagline: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--moss)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userEmail: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--sage)',
    opacity: 0.7,
  },
  btn: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '6px 14px',
    borderRadius: '3px',
    border: '1px solid var(--moss)',
    background: 'transparent',
    color: 'var(--sage)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
}

export default function Header({ user, onAuthChange }) {
  const [showAuth, setShowAuth] = useState(false)

  return (
    <>
      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={styles.logo}>Sylva</span>
          <span style={styles.tagline}>Kenya Tree Intelligence</span>
        </div>

        <div style={styles.right}>
          {user ? (
            <>
              <span style={styles.userEmail}>{user.email}</span>
              <button
                style={styles.btn}
                onClick={async () => {
                  const { supabase } = await import('../SupabaseClient')
                  await supabase.auth.signOut()
                  onAuthChange(null)
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <button style={styles.btn} onClick={() => setShowAuth(true)}>
              Sign in
            </button>
          )}
        </div>
      </header>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onAuth={(u) => { onAuthChange(u); setShowAuth(false) }}
        />
      )}
    </>
  )
}