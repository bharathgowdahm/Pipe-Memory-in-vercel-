import { useMemo } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Hero, Metric, Pill, ScoreBar } from './ui'
import { RISK_COLORS, SEV_COLOR, SEVERITY } from './constants'
import { daysBetween, iso } from './geo'
import { computeRisk } from './risk'
import { useStore } from './store'

export default function Dashboard() {
  const data = useStore()
  const risk = useMemo(() => computeRisk(data), [data])
  const today = iso(new Date())

  const leaks30 = data.leaks.filter((l) => daysBetween(l.date, today) <= 30).length
  const loss90 = data.leaks
    .filter((l) => daysBetween(l.date, today) <= 90)
    .reduce((s, l) => s + l.water_loss_lpd, 0)
  const km = data.pipes.reduce((s, p) => s + p.length_m, 0) / 1000

  const monthly = useMemo(() => {
    const m = {}
    data.leaks.forEach((l) => {
      const key = l.date.slice(0, 7)
      m[key] = m[key] || { month: key, Minor: 0, Moderate: 0, Major: 0 }
      m[key][l.severity] += 1
    })
    return Object.values(m).sort((a, b) => a.month.localeCompare(b.month))
  }, [data.leaks])

  const dist = Object.keys(RISK_COLORS).map((level) => ({
    name: level,
    value: risk.filter((r) => r.risk_level === level).length,
  }))

  return (
    <div>
      <Hero
        title="💧 PipeMemory"
        subtitle="Underground infrastructure memory — every pipe, repair, leak and complaint in one place."
      />

      <div className="grid g6">
        <Metric label="Pipe segments" value={data.pipes.length} />
        <Metric label="Network length" value={`${km.toFixed(1)} km`} />
        <Metric label="Leaks (30 days)" value={leaks30} />
        <Metric label="Open complaints" value={data.complaints.filter((c) => c.status !== 'Resolved').length} />
        <Metric label="High / critical" value={risk.filter((r) => ['High', 'Critical'].includes(r.risk_level)).length} />
        <Metric label="Est. loss (90d)" value={`${Math.round(loss90 / 1000).toLocaleString('en-IN')} kL`} />
      </div>

      <div className="grid g32" style={{ marginTop: 14 }}>
        <div className="card">
          <h3>Leak incidents per month</h3>
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={monthly}>
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
        <div className="card">
          <h3>Network risk distribution</h3>
          <ResponsiveContainer width="100%" height={290}>
            <PieChart>
              <Pie data={dist} dataKey="value" nameKey="name" innerRadius={62} outerRadius={100} paddingAngle={2}>
                {dist.map((d) => (
                  <Cell key={d.name} fill={RISK_COLORS[d.name]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="section-title">🚨 Top priority segments</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Pipe</th><th>Ward</th><th>Material</th><th>Age</th><th>Leaks (12m)</th>
              <th>Risk score</th><th>Level</th><th>Recommended action</th>
            </tr>
          </thead>
          <tbody>
            {risk.slice(0, 6).map((r) => (
              <tr key={r.pipe_id}>
                <td><b>{r.pipe}</b></td>
                <td>{r.ward}</td>
                <td>{r.material}</td>
                <td>{r.age} yrs</td>
                <td>{r.leaks_12m}</td>
                <td><ScoreBar score={r.risk_score} /></td>
                <td><Pill level={r.risk_level} /></td>
                <td>{r.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
