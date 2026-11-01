import { useMemo } from 'react'
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Hero } from './ui'
import { SEV_COLOR, SEVERITY } from './constants'
import { useStore } from './store'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Patterns() {
  const { pipes, leaks } = useStore()

  const byCause = useMemo(() => {
    const m = {}
    leaks.forEach((l) => (m[l.cause] = (m[l.cause] || 0) + 1))
    return Object.entries(m).map(([cause, n]) => ({ cause, leaks: n })).sort((a, b) => a.leaks - b.leaks)
  }, [leaks])

  const byMaterial = useMemo(() => {
    const km = {}
    pipes.forEach((p) => (km[p.material] = (km[p.material] || 0) + p.length_m / 1000))
    const byPipe = Object.fromEntries(pipes.map((p) => [p.id, p]))
    const n = {}
    leaks.forEach((l) => {
      const mat = byPipe[l.pipe_id]?.material
      if (mat) n[mat] = (n[mat] || 0) + 1
    })
    return Object.keys(km).map((material) => ({
      material,
      leaks_per_km: Math.round(((n[material] || 0) / km[material]) * 10) / 10,
    }))
  }, [pipes, leaks])

  const byWard = useMemo(() => {
    const byPipe = Object.fromEntries(pipes.map((p) => [p.id, p]))
    const m = {}
    leaks.forEach((l) => {
      const w = byPipe[l.pipe_id]?.ward
      if (w) m[w] = (m[w] || 0) + l.water_loss_lpd
    })
    return Object.entries(m).map(([ward, loss]) => ({ ward, loss })).sort((a, b) => a.loss - b.loss)
  }, [pipes, leaks])

  const seasonal = useMemo(() => {
    const rows = MONTHS.map((month) => ({ month, Minor: 0, Moderate: 0, Major: 0 }))
    leaks.forEach((l) => {
      rows[new Date(l.date).getMonth()][l.severity] += 1
    })
    return rows
  }, [leaks])

  const hotspots = useMemo(() => {
    const byPipe = Object.fromEntries(pipes.map((p) => [p.id, p]))
    const m = {}
    leaks.forEach((l) => {
      const key = `${l.lat.toFixed(3)},${l.lon.toFixed(3)}`
      m[key] = m[key] || { lat: l.lat.toFixed(3), lon: l.lon.toFixed(3), leaks: 0, loss: 0, ward: byPipe[l.pipe_id]?.ward }
      m[key].leaks += 1
      m[key].loss += l.water_loss_lpd
    })
    return Object.values(m).filter((h) => h.leaks >= 2).sort((a, b) => b.leaks - a.leaks).slice(0, 10)
  }, [pipes, leaks])

  return (
    <div>
      <Hero title="📈 Leak Patterns" subtitle="Understand where, why and when the network fails." />

      <div className="grid g2">
        <div className="card">
          <h3>Leaks by cause</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byCause} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="cause" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="leaks" fill="#1d6fa5" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3>Leaks per km by material</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byMaterial}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="material" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="leaks_per_km" fill="#e8590c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3>Water loss by ward (L/day, cumulative)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byWard} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="ward" width={150} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="loss" fill="#2bb3c0" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3>Seasonality (all years)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={seasonal}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {SEVERITY.map((s) => (
                <Bar key={s} dataKey={s} stackId="a" fill={SEV_COLOR[s]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="section-title">🔥 Repeat-failure hotspots (~100 m grid)</div>
      {hotspots.length === 0 ? (
        <div className="card empty">No repeat-failure hotspots yet.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Lat</th><th>Lon</th><th>Leaks</th><th>Loss (L/day)</th><th>Ward</th></tr>
            </thead>
            <tbody>
              {hotspots.map((h) => (
                <tr key={`${h.lat},${h.lon}`}>
                  <td>{h.lat}</td><td>{h.lon}</td><td><b>{h.leaks}</b></td>
                  <td>{Math.round(h.loss).toLocaleString('en-IN')}</td><td>{h.ward}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
