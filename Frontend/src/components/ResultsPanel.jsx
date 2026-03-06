// Results panel component displaying species cards with explanations
// Shows prediction results with species information
// src/components/ResultsPanel.jsx
// Slide-in panel showing ranked species results after a map click.

const styles = {
  panel: {
    position: 'fixed',
    top: 'var(--header-height)',
    right: 0,
    bottom: 0,
    width: 'var(--panel-width)',
    background: 'var(--forest)',
    borderLeft: '1px solid rgba(74,124,89,0.25)',
    overflowY: 'auto',
    zIndex: 500,
    animation: 'slideIn 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
  },
  topBar: {
    padding: '20px 24px 16px',
    borderBottom: '1px solid rgba(74,124,89,0.2)',
    position: 'sticky',
    top: 0,
    background: 'var(--forest)',
    zIndex: 1,
  },
  coordLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--moss)',
    marginBottom: '4px',
  },
  coordValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    color: 'var(--sage)',
  },
  climateBox: {
    margin: '16px 24px',
    padding: '14px 16px',
    background: 'rgba(74,124,89,0.08)',
    border: '1px solid rgba(74,124,89,0.2)',
    borderRadius: '4px',
  },
  climateTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: '9px',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'var(--moss)',
    marginBottom: '10px',
  },
  climateGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  climateItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  climateKey: {
    fontFamily: 'var(--font-mono)',
    fontSize: '9px',
    color: 'var(--moss)',
    letterSpacing: '0.08em',
  },
  climateVal: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    color: 'var(--parchment)',
    fontWeight: 500,
  },
  resultsHeader: {
    padding: '0 24px 12px',
    fontFamily: 'var(--font-mono)',
    fontSize: '9px',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'var(--moss)',
  },
  card: {
    margin: '0 16px 10px',
    padding: '16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(74,124,89,0.2)',
    borderRadius: '4px',
    transition: 'border-color 0.2s, background 0.2s',
    cursor: 'default',
    animation: 'fadeUp 0.3s ease both',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '6px',
  },
  rank: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--amber)',
    letterSpacing: '0.1em',
  },
  score: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--sage)',
  },
  speciesName: {
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic',
    fontSize: '16px',
    color: 'var(--parchment)',
    marginBottom: '3px',
    lineHeight: 1.3,
  },
  family: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--moss)',
    letterSpacing: '0.08em',
    marginBottom: '10px',
  },
  bar: {
    height: '2px',
    background: 'rgba(74,124,89,0.2)',
    borderRadius: '1px',
    marginBottom: '10px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--moss), var(--sage))',
    borderRadius: '1px',
    transition: 'width 0.6s ease',
  },
  description: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'rgba(184,212,192,0.65)',
    lineHeight: 1.6,
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
    textAlign: 'center',
    gap: '12px',
  },
  emptyIcon: {
    fontSize: '36px',
    opacity: 0.3,
  },
  emptyText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    color: 'var(--moss)',
    lineHeight: 1.6,
  },
  loadingWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '2px solid rgba(74,124,89,0.2)',
    borderTopColor: 'var(--sage)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--moss)',
    letterSpacing: '0.1em',
  },
}

// Human-readable labels for BioClim variables
const CLIM_LABELS = {
  bio01: { label: 'Mean Temp',    unit: '°C' },
  bio05: { label: 'Max Temp',     unit: '°C' },
  bio06: { label: 'Min Temp',     unit: '°C' },
  bio12: { label: 'Annual Rain',  unit: 'mm' },
  bio15: { label: 'Rain Season',  unit: 'cv' },
  bio19: { label: 'Cold Rain',    unit: 'mm' },
}

// Returns color based on similarity score
function confidenceColor(score) {
  if (score >= 0.55) return '#7eb89a'   // sage green — strong match
  if (score >= 0.40) return '#c8853a'   // amber — moderate match
  return '#c0605a'                      // muted red — weak match
}

// Returns a label for the confidence level
function confidenceLabel(score) {
  if (score >= 0.55) return 'Strong'
  if (score >= 0.40) return 'Moderate'
  return 'Weak'
}
export default function ResultsPanel({ loading, data, coords }) {
  // Panel is always visible when there's data or loading
  if (!loading && !data) return null

  return (
    <aside style={styles.panel}>

      {/* Coordinate display */}
      {coords && (
        <div style={styles.topBar}>
          <div style={styles.coordLabel}>Selected location</div>
          <div style={styles.coordValue}>
            {coords.lat.toFixed(4)}°, {coords.lng.toFixed(4)}°
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={styles.loadingWrap}>
          <div style={styles.spinner} />
          <span style={styles.loadingText}>Analysing climate profile...</span>
        </div>
      )}

      {/* Results */}
      {!loading && data && (
        <>
          {/* Climate summary */}
          <div style={styles.climateBox}>
            <div style={styles.climateTitle}>Climate profile</div>
            <div style={styles.climateGrid}>
              {Object.entries(data.bioclim).map(([key, val]) => (
                <div key={key} style={styles.climateItem}>
                  <span style={styles.climateKey}>
                    {CLIM_LABELS[key]?.label || key}
                  </span>
                  <span style={styles.climateVal}>
                    {val} {CLIM_LABELS[key]?.unit || ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Species cards */}
          <div style={styles.resultsHeader}>
            Top {data.results.length} matching species
          </div>

          {data.results.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>🌿</span>
              <p style={styles.emptyText}>
                No species found above the similarity threshold for this location.
                Try a different point.
              </p>
            </div>
          ) : (
            data.results.map((species, i) => (
              <div
                key={i}
                style={{ ...styles.card, animationDelay: `${i * 0.07}s` }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(74,124,89,0.5)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(74,124,89,0.2)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }}
              >
                <div style={styles.cardTop}>
                  <span style={styles.rank}>#{i + 1}</span>
                  <span style={{ ...styles.score,
                    color: confidenceColor(species.similarity),
                    fontWeight: 500,
                  }}>
                    {(species.similarity * 100).toFixed(1)}% match
                  </span>
                </div>

                <div style={styles.speciesName}>{species.species_name}</div>
                <div style={styles.family}>{species.family}</div>

                {/* Similarity bar */}
                <div style={styles.bar}>
                  <div style={{
                    ...styles.barFill,
                    width: `${species.similarity * 100}%` ,
                    background: confidenceColor(species.similarity),
                  }} />
                </div>

                <div style={styles.description}>{species.description}</div>
              </div>
            ))
          )}

          <div style={{ height: '24px' }} />
        </>
      )}
    </aside>
  )
}