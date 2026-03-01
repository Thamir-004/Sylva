// src/components/Map.jsx
// Leaflet map locked to Kenya bounds. Click to query species.

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

// Kenya bounding box — restricts the map view to Kenya
const KENYA_BOUNDS = [[-4.67, 33.91], [4.62, 41.90]]
const KENYA_CENTER = [-0.023559, 37.906193]

// Custom pin marker using SVG — matches our forest aesthetic
// WHY custom: Leaflet's default blue marker clashes with the dark theme
function createPin(isLoading = false) {
  const color = isLoading ? '#7eb89a' : '#c8853a'
  const svg = `
    <svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.27 21.73 0 14 0z"
            fill="${color}" opacity="0.95"/>
      <circle cx="14" cy="14" r="5" fill="white" opacity="0.9"/>
    </svg>
  `
  return L.divIcon({
    html: svg,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -38],
    className: '',
  })
}

// Handles map click events
// WHY separate component: react-leaflet hooks (useMapEvents) must be
// used inside the MapContainer, not outside it.
function ClickHandler({ onMapClick, hasPanel }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng

      // Rough Kenya bounds check — give friendly error outside Kenya
      if (lat < -4.67 || lat > 4.62 || lng < 33.91 || lng > 41.90) {
        alert('Please click within Kenya to get species predictions.')
        return
      }
      onMapClick(lat, lng)
    },
  })
  return null
}

const styles = {
  wrap: {
    position: 'fixed',
    top: 'var(--header-height)',
    left: 0,
    right: 0,
    bottom: 0,
    transition: 'right 0.3s ease',
  },
  hint: {
    position: 'absolute',
    bottom: '32px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(26,46,26,0.88)',
    border: '1px solid rgba(74,124,89,0.35)',
    backdropFilter: 'blur(8px)',
    borderRadius: '24px',
    padding: '8px 20px',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--sage)',
    letterSpacing: '0.08em',
    zIndex: 400,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  },
}

export default function Map({ onMapClick, selectedCoords, loading, hasPanel }) {
  const mapStyle = {
    ...styles.wrap,
    right: hasPanel ? 'var(--panel-width)' : 0,
  }

  return (
    <div style={mapStyle}>
      <MapContainer
        center={KENYA_CENTER}
        zoom={6}
        minZoom={5}
        maxZoom={14}
        maxBounds={KENYA_BOUNDS}
        maxBoundsViscosity={0.85}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />

        <ClickHandler onMapClick={onMapClick} hasPanel={hasPanel} />

        {/* Show pin at selected location */}
        {selectedCoords && (
          <Marker
            position={[selectedCoords.lat, selectedCoords.lng]}
            icon={createPin(loading)}
          >
            <Popup>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                {loading
                  ? 'Analysing...'
                  : `${selectedCoords.lat.toFixed(4)}°, ${selectedCoords.lng.toFixed(4)}°`
                }
              </span>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Click hint — shown until first click */}
      {!selectedCoords && (
        <div style={styles.hint}>
          🌿 Click anywhere on Kenya to identify tree species
        </div>
      )}
    </div>
  )
}