// src/App.jsx
// Root component — manages global state and wires everything together.

import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { predict } from './api'
import Header from './components/Header.jsx'
import Map from './components/Map'
import ResultsPanel from './components/ResultsPanel'

export default function App() {
  const [user, setUser]               = useState(null)
  const [selectedCoords, setCoords]   = useState(null)
  const [loading, setLoading]         = useState(false)
  const [data, setData]               = useState(null)
  const [error, setError]             = useState(null)

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

  async function handleMapClick(lat, lng) {
    setCoords({ lat, lng })
    setLoading(true)
    setData(null)
    setError(null)

    try {
      const result = await predict(lat, lng, user?.id ?? null)
      setData(result)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Something went wrong. Please try again.'
      setError(msg)
      alert(`Error: ${msg}`)
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
    </>
  )
}