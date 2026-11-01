import { useMemo, useState } from 'react'
import {
  CircleMarker, LayersControl, MapContainer, Polyline, TileLayer, Tooltip, useMapEvents,
} from 'react-leaflet'
import { Hero, Pill } from './ui'
import { MAP_CENTER, RISK_COLORS, SEV_COLOR, STATUS_COLOR } from './constants'
import { fmtDate, inr, pointOnPipe } from './geo'
import { computeRisk } from './risk'
import { setPick, usePick, useStore } from './store'

function ClickPicker() {
  useMapEvents({
    click(e) {
      setPick([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}

export default function MapPage() {
  const data = useStore()
  const pick = usePick()
  const risk = useMemo(() => computeRisk(data), [data])
  const byPipe = useMemo(() => Object.fromEntries(risk.map((r) => [r.pipe_id, r])), [risk])
  const pipesById = useMemo(() => Object.fromEntries(data.pipes.map((p) => [p.id, p])), [data.pipes])

  const [layers, setLayers] = useState({ pipes: true, leaks: true, loss: false, complaints: true, repairs: false })
  const toggle = (k) => setLayers((s) => ({ ...s, [k]: !s[k] }))

  return (
    <div>
      <Hero
        title="🗺️ Network Map"
        subtitle="Pipes coloured by risk, leak incidents, complaint locations and repair history. Click the map to pick a location."
      />

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="toggles">
          {[
            ['pipes', 'Pipes by risk'], ['leaks', 'Leak markers'], ['loss', 'Water-loss bubbles'],
            ['complaints', 'Complaints'], ['repairs', 'Repairs'],
          ].map(([k, label]) => (
            <label key={k}>
              <input type="checkbox" checked={layers[k]} onChange={() => toggle(k)} />
              {label}
            </label>
          ))}
        </div>
      </div>

      {pick && (
        <div className="info">
          📍 Selected {pick[0].toFixed(5)}, {pick[1].toFixed(5)} — it will pre-fill the Log Data forms.{' '}
          <button className="btn ghost small" onClick={() => setPick(null)}>Clear</button>
        </div>
      )}

      <div className="map">
        <MapContainer center={MAP_CENTER} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Street">
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                attribution="Esri World Imagery"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>
          </LayersControl>
          <ClickPicker />

          {layers.pipes &&
            data.pipes.map((p) => {
              const r = byPipe[p.id]
              if (!r) return null
              return (
                <Polyline
                  key={p.id}
                  positions={[[p.lat1, p.lon1], [p.lat2, p.lon2]]}
                  pathOptions={{
                    color: RISK_COLORS[r.risk_level],
                    weight: ['High', 'Critical'].includes(r.risk_level) ? 6 : 4,
                    opacity: 0.9,
                  }}
                >
                  <Tooltip sticky>
                    <b>{p.name}</b><br />
                    {p.ward}<br />
                    {p.material} · {p.diameter_mm} mm · {p.install_year}<br />
                    Risk {r.risk_score} ({r.risk_level}) · Leaks {r.total_leaks}<br />
                    Action: {r.action}
                  </Tooltip>
                </Polyline>
              )
            })}

          {layers.loss &&
            data.leaks.map((l) => (
              <CircleMarker
                key={`loss${l.id}`}
                center={[l.lat, l.lon]}
                radius={Math.max(6, Math.sqrt(l.water_loss_lpd) / 3)}
                pathOptions={{ color: '#2bb3c0', fillColor: '#2bb3c0', fillOpacity: 0.28, weight: 1 }}
              />
            ))}

          {layers.leaks &&
            data.leaks.map((l) => (
              <CircleMarker
                key={`leak${l.id}`}
                center={[l.lat, l.lon]}
                radius={6}
                pathOptions={{ color: '#fff', weight: 1.5, fillColor: SEV_COLOR[l.severity], fillOpacity: 1 }}
              >
                <Tooltip>
                  {l.severity} leak · {fmtDate(l.date)}<br />
                  {l.cause} · {l.water_loss_lpd.toLocaleString('en-IN')} L/day
                </Tooltip>
              </CircleMarker>
            ))}

          {layers.complaints &&
            data.complaints.map((c) => (
              <CircleMarker
                key={`c${c.id}`}
                center={[c.lat, c.lon]}
                radius={5}
                pathOptions={{ color: STATUS_COLOR[c.status], fillColor: STATUS_COLOR[c.status], fillOpacity: 0.8, weight: 1 }}
              >
                <Tooltip>{c.complaint_type} · {c.status} · {fmtDate(c.date)}</Tooltip>
              </CircleMarker>
            ))}

          {layers.repairs &&
            data.repairs.map((r) => {
              const p = pipesById[r.pipe_id]
              if (!p) return null
              return (
                <CircleMarker
                  key={`r${r.id}`}
                  center={pointOnPipe(p, 0.5)}
                  radius={5}
                  pathOptions={{ color: '#2e9e5b', fillColor: '#2e9e5b', fillOpacity: 0.95, weight: 2 }}
                >
                  <Tooltip>{r.repair_type} · {fmtDate(r.date)} · {inr(r.cost_inr)}</Tooltip>
                </CircleMarker>
              )
            })}

          {pick && (
            <CircleMarker
              center={pick}
              radius={9}
              pathOptions={{ color: '#7048e8', fillColor: '#7048e8', fillOpacity: 0.5, weight: 3 }}
            />
          )}
        </MapContainer>
      </div>

      <div className="legend">
        {Object.entries(RISK_COLORS).map(([lvl]) => (
          <Pill key={lvl} level={lvl} />
        ))}
        <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
          Pipe colour = risk · dots = leaks (blue minor, amber moderate, red major)
        </span>
      </div>
    </div>
  )
}
