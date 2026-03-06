// src/App.jsx
// Root component — manages global state and wires everything together.

import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { predict } from './api'
import Header from './components/Header.jsx'
import Map from './components/Map'
import ResultsPanel from './components/ResultsPanel'

const toastStyle = {
  position: 'fixed',
  bottom: '80px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(26,46,26,0.95)',
  border: '1px solid rgba(200,133,58,0.5)',
  borderRadius: '24px',
  padding: '10px 24px',
  fontFamily: 'var(--font-mono)',
  fontSize: '12px',
  color: '#e8c49a',
  letterSpacing: '0.05em',
  zIndex: 900,
  animation: 'fadeUp 0.2s ease',
  pointerEvents: 'none',
  whiteSpace: 'nowrap',
}

export default function App() {
  const [user, setUser]               = useState(null)
  const [selectedCoords, setCoords]   = useState(null)
  const [loading, setLoading]         = useState(false)
  const [data, setData]               = useState(null)
  const [toast, setToast]             = useState(null)

  // Check for existing Supabase session on load
  // WHY: if the user refreshes the page, their session persists in
  // localStorage. We restore it here so they don't have to sign in again.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes (sign in / sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    )

    return () => subscription.unsubscribe()
  }, [])

    // Show a toast message that auto-dismisses after 3 seconds
  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleMapClick(lat, lng) {
    setCoords({ lat, lng })
    setLoading(true)
    setData(null)
    

    try {
      const result = await predict(lat, lng, user?.id ?? null)
      setData(result)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Something went wrong. Please try again.'
      showToast(msg)
      setCoords(null) // Clear pin on error
      
    } finally {
      setLoading(false)
    }
  }

  const hasPanel = loading || data !== null

  return (
    <>
      <Header user={user} onAuthChange={setUser} />

      <Map
        onMapClick={handleMapClick}
        selectedCoords={selectedCoords}
        loading={loading}
        hasPanel={hasPanel}
      />

      <ResultsPanel
        loading={loading}
        data={data}
        coords={selectedCoords}
      />

        {/* Toast notification for water clicks and errors */}
      {toast && <div style={toastStyle}>⚠ {toast}</div>}
    </>
  )
}